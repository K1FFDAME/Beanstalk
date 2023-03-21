/**
 * SPDX-License-Identifier: MIT
 **/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import "../LibAppStorage.sol";
import "../../C.sol";
import "./LibUnripeSilo.sol";
import "./LibLegacyTokenSilo.sol";
import "~/libraries/LibSafeMathSigned128.sol";
import "~/libraries/LibSafeMathSigned96.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/SafeCast.sol";
import "~/libraries/LibBytes.sol";


/**
 * @title LibTokenSilo
 * @author Publius
 * @notice Contains functions for depositing, withdrawing and claiming
 * whitelisted Silo tokens.
 *
 * For functionality related to Stalk, and Roots, see {LibSilo}.
 */
library LibTokenSilo {
    using SafeMath for uint256;
    using SafeMath for uint128;
    using SafeMath for int128;
    using SafeMath for uint32;
    using LibSafeMathSigned128 for int128;
    using SafeCast for int128;
    using SafeCast for uint256;
    using LibSafeMathSigned96 for int96;

    //////////////////////// EVENTS ////////////////////////

    /**
     * @dev IMPORTANT: copy of {TokenSilo-AddDeposit}, check there for details.
     */
    event AddDeposit(
        address indexed account,
        address indexed token,
        int96 stem,
        uint256 amount,
        uint256 bdv
    );

    // added as the ERC1155 deposit upgrade
    event TransferSingle(
        address indexed operator, 
        address indexed sender, 
        address indexed recipient, 
        uint256 depositId, 
        uint256 amount
    );


    //////////////////////// ACCOUNTING: TOTALS ////////////////////////
    
    /**
     * @dev Increment the total amount of `token` deposited in the Silo.
     */
    // TODO: should we have an ERC721 + ERC1155 equlivant, or should we update silo balance mapping?
    function incrementTotalDeposited(address token, uint256 amount) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.siloBalances[token].deposited = s.siloBalances[token].deposited.add(
            amount
        );
    }

    /**
     * @dev Decrement the total amount of `token` deposited in the Silo.
     */
    function decrementTotalDeposited(address token, uint256 amount) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.siloBalances[token].deposited = s.siloBalances[token].deposited.sub(
            amount
        );
    }

    //////////////////////// ADD DEPOSIT ////////////////////////

    /**
     * @return stalk The amount of Stalk received for this Deposit.
     * 
     * @dev Calculate the current BDV for `amount` of `token`, then perform 
     * Deposit accounting.
     */
    /**
     * TODO: should this be generalized for any token standard (ERC20 + ERC721 + ERC1155), or
     * should we have separate functions for each?
     */ 
    function deposit(
        address account,
        address token,
        int96 stem,
        uint256 amount
    ) internal returns (uint256) {
        uint256 bdv = beanDenominatedValue(token, amount);
        return depositWithBDV(account, token, stem, amount, bdv);
    }

    /**
     * @dev Once the BDV received for Depositing `amount` of `token` is known, 
     * add a Deposit for `account` and update the total amount Deposited.
     *
     * `s.ss[token].stalkIssuedPerBdv` stores the number of Stalk per BDV for `token`.
     *
     * FIXME(discuss): If we think of Deposits like 1155s, we might call the
     * combination of "incrementTotalDeposited" and "addDepositToAccount" as 
     * "minting a deposit".
     */
    function depositWithBDV(
        address account,
        address token,
        int96 stem,
        uint256 amount,
        uint256 bdv
    ) internal returns (uint256) {
        require(bdv > 0, "Silo: No Beans under Token.");
        AppStorage storage s = LibAppStorage.diamondStorage();
        
        incrementTotalDeposited(token, amount); // Update Totals        
        addDepositToAccount(
            account, 
            token, 
            stem, 
            amount, 
            bdv, 
            true // {DepositWithBDV} is only used for deposits, and thus is a transferSingle. 
        ); // Add to Account
        return (
            bdv.mul(s.ss[token].stalkIssuedPerBdv) //formerly stalk
        );
    }

    /**
     * @dev Add `amount` of `token` to a user's Deposit in `stemTipForToken`. Requires a
     * precalculated `bdv`.
     *
     * If a Deposit doesn't yet exist, one is created. Otherwise, the existing
     * Deposit is updated.
     * 
     * `amount` & `bdv` are cast uint256 -> uint128 to optimize storage cost,
     * since both values can be packed into one slot.
     * 
     * Unlike {removeDepositFromAccount}, this function DOES EMIT an 
     * {AddDeposit} event. See {removeDepositFromAccount} for more details.
     */
    function addDepositToAccount(
        address account,
        address token,
        int96 stem,
        uint256 amount,
        uint256 bdv,
        bool isTransferSingle
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // Pack the Deposit data into a single bytes32
        bytes32 depositId = LibBytes.packAddressAndStem(
            token,
            stem
        );
        // create memory var to save gas (TODO: check if this is actually saving gas)
        Account.Deposit memory d = s.a[account].deposits[depositId];

        // add amount to the deposits... 
        d.amount = uint128(d.amount.add(amount.toUint128()));
        d.bdv = uint128(d.bdv.add(bdv.toUint128()));
        
        // set it 
        s.a[account].deposits[depositId] = d;
        
        // get token and GSPBDV of the depositData, for updating mow status and emitting event 
        // update the mow status (note: mow status is per token, not per depositId)
        s.a[account].mowStatuses[token].bdv = uint128(s.a[account].mowStatuses[token].bdv.add(bdv.toUint128()));

        /**@dev  {addDepositToAccount} is used for both new deposits, and
         * transferring Deposits. When a user is transferring Deposit(s), we omit the 
         * {transferSingle} event as it is already handled by the {transferBatch} event. 
         **/

        // TODO: is it better to have the conditional here, or add it in a place where its implicitly a deposit/mint?
        // PROs: decrease logic needed to determine whether to emit.
        // CONs: impairs developer experience by having events in different multiple locations 
        
        if(isTransferSingle){
            emit TransferSingle(msg.sender, address(0), account, uint256(depositId), amount);
        }
        emit AddDeposit(account, token, stem, amount, bdv);
    }

    //////////////////////// REMOVE DEPOSIT ////////////////////////

    /**
     * @dev Remove `amount` of `token` from a user's Deposit in `stem`.
     *
     * A "Crate" refers to the existing Deposit in storage at:
     *  `s.a[account].deposits[token][stem]`
     *
     * Partially removing a Deposit should scale its BDV proportionally. For ex.
     * removing 80% of the tokens from a Deposit should reduce its BDV by 80%.
     *
     * During an update, `amount` & `bdv` are cast uint256 -> uint128 to
     * optimize storage cost, since both values can be packed into one slot.
     *
     * This function DOES **NOT** EMIT a {RemoveDeposit} event. This
     * asymmetry occurs because {removeDepositFromAccount} is called in a loop
     * in places where multiple deposits are removed simultaneously, including
     * {TokenSilo-removeDepositsFromAccount} and {TokenSilo-_transferDeposits}.
     */

    // TODO: Brean: ask pizza about why we remove `amount > crateAmount` check (probably because unripe)
    function removeDepositFromAccount(
        address account,
        address token,
        int96 stem,
        uint256 amount
    ) internal returns (uint256 crateBDV) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        bytes32 depositId = LibBytes.packAddressAndStem(token,stem);
        Account.Deposit memory d = s.a[account].deposits[depositId];
        
        uint256 crateAmount;
        (crateAmount, crateBDV) = (d.amount,d.bdv);

        require(amount <= crateAmount, "Silo: Crate balance too low.");

        // Partial remove
        if (amount < crateAmount) {
            uint256 removedBDV = amount.mul(crateBDV).div(crateAmount);
            uint256 updatedBDV = crateBDV.sub(removedBDV);
            uint256 updatedAmount = crateAmount.sub(amount);
                
            require(
                updatedBDV <= uint128(-1) && updatedAmount <= uint128(-1), //this code was here before, but maybe there's a better way to do this?
                "Silo: uint128 overflow."
            );

            s.a[account].deposits[depositId].amount = uint128(updatedAmount);
            s.a[account].deposits[depositId].bdv = uint128(updatedBDV);
            //remove from the mow status bdv amount, which keeps track of total token deposited per farmer
            s.a[account].mowStatuses[token].bdv = uint128(s.a[account].mowStatuses[token].bdv.sub(removedBDV));
            return removedBDV;
        }
        // Full remove
        if (crateAmount > 0) delete s.a[account].deposits[depositId];


        uint256 updatedTotalBdv = uint256(s.a[account].mowStatuses[token].bdv).sub(crateBDV); //this will `SafeMath: subtraction overflow` if amount > crateAmount, but I want it to be able to call through to the Legacy stuff below for excess remove
        s.a[account].mowStatuses[token].bdv = uint128(updatedTotalBdv);
    }

    //////////////////////// GETTERS ////////////////////////

    /**
     * @dev Calculate the BDV ("Bean Denominated Value") for `amount` of `token`.
     * 
     * Makes a call to a BDV function defined in the SiloSettings for this 
     * `token`. See {AppStorage.sol:Storage-SiloSettings} for more information.
     */
    function beanDenominatedValue(address token, uint256 amount)
        internal
        returns (uint256 bdv)
    {
        AppStorage storage s = LibAppStorage.diamondStorage();

        // BDV functions accept one argument: `uint256 amount`
        bytes memory callData = abi.encodeWithSelector(
            s.ss[token].selector,
            amount
        );

        (bool success, bytes memory data) = address(this).call(
            callData
        );

        if (!success) {
            if (data.length == 0) revert();
            assembly {
                revert(add(32, data), mload(data))
            }
        }

        assembly {
            bdv := mload(add(data, add(0x20, 0)))
        }
    }

    /**
     * @dev Locate the `amount` and `bdv` for a user's Deposit in storage.
     * 
     * Silo V2 Deposits are stored within each {Account} as a mapping of:
     *  `address token => uint32 season => { uint128 amount, uint128 bdv }`
     * 
     * Unripe BEAN and Unripe LP are handled independently so that data
     * stored in the legacy Silo V1 format and the new Silo V2 format can
     * be appropriately merged. See {LibUnripeSilo} for more information.
     *
     * FIXME(naming): rename to `getDeposit()`?
     */
    function tokenDeposit(
        address account,
        address token,
        int96 stem
    ) internal view returns (uint256 amount, uint256 bdv) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        bytes32 depositId = LibBytes.packAddressAndStem(
            token,
            stem
        );
        amount = s.a[account].deposits[depositId].amount;
        bdv = s.a[account].deposits[depositId].bdv;
    }
    
    /**
     * @dev Get the number of Stalk per BDV per Season for a whitelisted token. Formerly just seeds.
     * Note this is stored as 1e6, i.e. 1_000_000 units of this is equal to 1 old seed.
     */
    function stalkEarnedPerSeason(address token) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return uint256(s.ss[token].stalkEarnedPerSeason);
    }

    /**
     * @dev Get the number of Stalk per BDV for a whitelisted token. Formerly just stalk.
     */
    function stalkIssuedPerBdv(address token) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return uint256(s.ss[token].stalkIssuedPerBdv);
    }

    //this returns grown stalk with no decimals
    function stemTipForToken(IERC20 token)
        internal
        view
        returns (int96 _stemTipForToken)
    {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // SiloSettings storage ss = s.ss[token]; //tried to use this, but I get `DeclarationError: Identifier not found or not unique.`
        
        //replace the - here with sub to disable support for when the current season is less than the silov3 epoch season
        _stemTipForToken = s.ss[address(token)].milestoneStem +
            int96(int96(s.ss[address(token)].stalkEarnedPerSeason).mul(int96(s.season.current)-int96(s.ss[address(token)].milestoneSeason)).div(1e6)) //round here
        ;
        
    }

    function grownStalkForDeposit(
        address account,
        IERC20 token,
        int96 stem
    )
        internal
        view
        returns (uint grownStalk)
    {
        // stemTipForToken(token) > depositGrownStalkPerBdv for all valid Deposits
        int96 _stemTip = stemTipForToken(token);
        require(stem <= _stemTip, "Silo: Invalid Deposit");
        uint deltaStemTip = uint(stemTipForToken(token).sub(stem));
        (, uint bdv) = tokenDeposit(account, address(token), stem);
        
        grownStalk = deltaStemTip.mul(bdv);
        
    }

    //this does not include stalk that has not been mowed
    //this function is used to convert, to see how much stalk would have been grown by a deposit at a 
    //given grown stalk index
    function calculateStalkFromStemAndBdv(IERC20 token, int96 grownStalkIndexOfDeposit, uint256 bdv)
        internal
        view
        returns (int96 grownStalk)
    {
        int96 _stemTipForToken = LibTokenSilo.stemTipForToken(token);
        return _stemTipForToken.sub(grownStalkIndexOfDeposit).mul(int96(bdv));
    }

    /// @dev is there a way to use grownStalk as the output?
    function calculateTotalGrownStalkandGrownStalk(IERC20 token, uint256 grownStalk, uint256 bdv)
        internal
        view 
        returns (uint256 _grownStalk, int96 stem)
    {
        int96 _stemTipForToken = LibTokenSilo.stemTipForToken(token);
        stem = _stemTipForToken-int96(grownStalk.div(bdv));
        // todo: talk to pizza about depositing at mid season
        // is it possible to skip the math calc here? 
        _grownStalk = uint256(_stemTipForToken.sub(stem).mul(int96(bdv)));
    }


    //takes in grownStalk total by a previous deposit, and a bdv, returns
    //what the stem index should be to have that same amount of grown stalk for the input token
    function grownStalkAndBdvToStem(IERC20 token, uint256 grownStalk, uint256 bdv)
        internal
        view
        returns (int96 cumulativeGrownStalk)
    {
        //first get current latest grown stalk index
        int96 _stemTipForToken = LibTokenSilo.stemTipForToken(token);
        //then calculate how much stalk each individual bdv has grown
        int96 stem = int96(grownStalk.div(bdv));
        //then subtract from the current latest index, so we get the index the deposit should have happened at
        //note that we want this to be able to "subtraction overflow" aka go below zero, because
        //there will be many cases where you'd want to convert and need to go far back enough in the
        //grown stalk index to need a negative index
        return _stemTipForToken - stem;
    }
}
