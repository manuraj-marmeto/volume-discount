// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const metaData = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  // Loop through each line item in the cart to find if it has the specified tag
  const discountApplication = input.cart.lines.map(line => {
    if (line.merchandise.__typename === "ProductVariant"){

      const productTag = line.merchandise.product.hasAnyTag === true;
      
      if(productTag){
      // Check if the quantity matches any in the discounts array

        const applicableDiscount = metaData.discounts
          .slice() // Copy the discounts array to sort without affecting the original
          .sort((a, b) => b.quantity - a.quantity) // Sort by quantity in descending order
          .find(discount => line.quantity >= discount.quantity);

        if (applicableDiscount) {
          return {
            message: applicableDiscount.message,
            targets: [
              {
                cartLine: {
                  id: line.id,
                }
              }
            ],
            value: {
              percentage: {
                value: applicableDiscount.discount
              }
            }
          };
        }
      }
    }
    return null;
  }).filter(discount => discount !== null); // Filter out any null values for non-applicable lines

  // If no discounts are applicable, return EMPTY_DISCOUNT
  return discountApplication.length > 0 ? {
    discountApplicationStrategy: DiscountApplicationStrategy.Maximum,
    discounts: discountApplication
  } : EMPTY_DISCOUNT;
}