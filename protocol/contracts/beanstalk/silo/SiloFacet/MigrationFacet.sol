/**
 * SPDX-License-Identifier: MIT
 **/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "~/libraries/Silo/LibLegacyTokenSilo.sol";
import "~/libraries/Token/LibTransfer.sol";
import "../../ReentrancyGuard.sol";

/**
 * @author pizzaman1337
 * @title Handles Migration related functions for the new Silo
 **/
contract MigrationFacet is ReentrancyGuard {

    /** 
     * @notice Migrates farmer's deposits from old (seasons based) to new silo (stems based).
     * @param account Address of the account to migrate
     * @param tokens Array of tokens to migrate
     * @param seasons The seasons in which the deposits were made
     * @param amounts The amounts of those deposits which are to be migrated
     *
     *
     * @dev When migrating an account, you must submit all of the account's deposits,
     * or the migration will not pass because the seed check will fail. The seed check
     * adds up the BDV of all submitted deposits, and multiples by the corresponding
     * seed amount for each token type, then compares that to the total seeds stored for that user.
     * If everything matches, we know all deposits were submitted, and the migration is valid.
     *
     * Deposits are migrated to the stem storage system on a 1:1 basis. Accounts with
     * lots of deposits may take a considerable amount of gas to migrate.
     */
    function mowAndMigrate(address account, address[] calldata tokens, uint32[][] calldata seasons, uint256[][] calldata amounts) external payable {
        LibLegacyTokenSilo._mowAndMigrate(account, tokens, seasons, amounts);
    }

    /** 
     * @notice Migrates farmer's deposits from old (seasons based) to new silo (stems based).
     * @param account Address of the account to migrate
     *
     * @dev If a user's lastUpdate was set, which means they had deposits in the silo,
     * but they currently have no deposits, then this function can be used to migrate
     * their account to the new silo using less gas.
     */
    function mowAndMigrateNoDeposits(address account) external payable {
        LibLegacyTokenSilo._migrateNoDeposits(account);
    }

    //////////////////////// CLAIM ////////////////////////

    // as of the zero withdraw update, these functions are no longer used. 
    // However, these are kept for backwards compatability.
    function claimWithdrawal(
        address token,
        uint32 season,
        LibTransfer.To mode
    ) external payable nonReentrant {
        require(s.siloBalances[token].withdrawn > 0, "Silo: no withdraw available");
        uint256 amount = LibLegacyTokenSilo._claimWithdrawal(msg.sender, token, season);
        LibTransfer.sendToken(IERC20(token), amount, msg.sender, mode);
    }

    function claimWithdrawals(
        address token,
        uint32[] calldata seasons,
        LibTransfer.To mode
    ) external payable nonReentrant {
        require(s.siloBalances[token].withdrawn > 0, "Silo: no withdraw available");
        uint256 amount = LibLegacyTokenSilo._claimWithdrawals(msg.sender, token, seasons);
        LibTransfer.sendToken(IERC20(token), amount, msg.sender, mode);
    }

}