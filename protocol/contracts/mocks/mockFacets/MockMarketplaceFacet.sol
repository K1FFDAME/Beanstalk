/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../farm/facets/MarketplaceFacet/MarketplaceFacet.sol";

/**
 * @author Publius
 * @title Mock Marketplace Facet
**/
contract MockMarketplaceFacet is MarketplaceFacet {

    function _evaluatePPoly(
        PiecewisePolynomial calldata f,
        uint256 x,
        uint256 pieceIndex
    ) public view returns (uint256) {
        return evaluatePolynomial(f, x, pieceIndex);
    }

    function _getDynamicOrderAmount(PiecewisePolynomial calldata f, uint256 index, uint256 start, uint256 amount) external view returns (uint256) {
        return getDynamicOrderAmount(f, index + start, amount);
    }

    function _findIndex(uint256[16] calldata array, uint256 value) external pure returns (uint256) {
        uint256 numIntervals = getNumPieces(array);
        return findPieceIndex(array, value, numIntervals - 1);
    }


}
