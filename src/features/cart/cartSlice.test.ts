import cartReducer, {
  CartState,
  updateQuantity,
  addToCart,
  removeFromCart,
  getNumItems,
  getTotalPrice
} from "./cartSlice";

import { getMemoizedNumItems } from "./cartSlice";
import type { RootState } from "../../app/store";
import products from "../../../public/products.json";
import * as api from "../../app/api";

jest.mock("../../app/api", () => {
  return {
    async getProducts() {
      return [];
    },
    async checkout(items: api.CartItems = {}) {
      const empty = Object.keys(items).length === 0;
      if (empty) throw new Error("Must include cart items");
      if (items.badItem > 0) return { success: false };
      return { success: true };
    }
  }
})

test("checkout should work", async () => {
  console.log(api);
  
  await api.checkout({ fakeItem: 4 });
});


describe("cart reducer", () => {
  test("an empty action", () => {
    const initialState = undefined;
    const action = { type: "" };
    const state = cartReducer(initialState, action);
    expect(state).toEqual({
      checkoutState: "READY",
      errorMessage: "",
      items: {},
    });
  });
  test("addToCart", () => {
    const initialState = undefined;
    const action = addToCart("abc");
    let state = cartReducer(initialState, action);
    expect(state).toEqual({
      checkoutState: "READY",
      errorMessage: "",
      items: { abc: 1 },
    });
    state = cartReducer(state, action);
    state = cartReducer(state, action);
    expect(state).toEqual({
      checkoutState: "READY",
      errorMessage: "",
      items: { abc: 3 },
    });
  });
  test("removeFromCart", () => {
    const initialState: CartState = {
      checkoutState: "READY",
      errorMessage: "",
      items: { abc: 1, def: 3 },
    };
    const action = removeFromCart("abc");
    const state = cartReducer(initialState, action);
    expect(state).toEqual({
      checkoutState: "READY",
      errorMessage: "",
      items: { def: 3 },
    });
  });
  test("updateQuantity", () => {
    const initialState: CartState = {
      checkoutState: "READY",
      errorMessage: "",
      items: { abc: 1, def: 3 },
    };
    const action = updateQuantity({ id: "def", quantity: 5 });
    const state = cartReducer(initialState, action);
    expect(state).toEqual({
      checkoutState: "READY",
      errorMessage: "",
      items: { abc: 1, def: 5 },
    });
  });
});

describe("selectors", () => {
  describe("getNumItems", () => {
    it("should return 0 with no items", () => {
      const cart: CartState = {
        checkoutState: "READY",
        errorMessage: "",
        items: {},
      };
      const result = getNumItems({ cart } as RootState);
      expect(result).toEqual(0);
    });
    it("should add up the total", () => {
      const cart: CartState = {
        checkoutState: "READY",
        errorMessage: "",
        items: { abc: 3, def: 3 },
      };
      const result = getNumItems({ cart } as RootState);
      expect(result).toEqual(6);
    });
  });
});

describe("selectors", () => {
  describe("getMemoizedNumItems", () => {
    it("should return 0 with no items", () => {
      const cart: CartState = {
        checkoutState: "READY",
        errorMessage: "",
        items: {},
      };
      const result = getMemoizedNumItems({ cart } as RootState);
      expect(result).toEqual(0);
    });
    it("should add up the total", () => {
      const cart: CartState = {
        checkoutState: "READY",
        errorMessage: "",
        items: { abc: 3, def: 3 },
      };
      const result = getMemoizedNumItems({ cart } as RootState);
      expect(result).toEqual(6);
    });
    it("should not compute again with the same state", () => {
      const cart: CartState = {
        checkoutState: "READY",
        errorMessage: "",
        items: { abc: 3, def: 3 },
      };
      getMemoizedNumItems.resetRecomputations();
      getMemoizedNumItems({ cart } as RootState);
      expect(getMemoizedNumItems.recomputations()).toEqual(1);
      getMemoizedNumItems({ cart } as RootState);
      expect(getMemoizedNumItems.recomputations()).toEqual(1);
      getMemoizedNumItems({ cart } as RootState);
      getMemoizedNumItems({ cart } as RootState);
      getMemoizedNumItems({ cart } as RootState);
      expect(getMemoizedNumItems.recomputations()).toEqual(1);
    });
    it("should recompute with new state", () => {
      const cart: CartState = {
        checkoutState: "READY",
        errorMessage: "",
        items: { abc: 3, def: 3 },
      };
      getMemoizedNumItems.resetRecomputations();
      getMemoizedNumItems({ cart } as RootState);
      expect(getMemoizedNumItems.recomputations()).toEqual(1);
      cart.items = { abc: 2 };
      getMemoizedNumItems({ cart } as RootState);
      expect(getMemoizedNumItems.recomputations()).toEqual(2);
    });
  });
});
describe("selectors", () => {
  describe("getTotalPrice", () => {
    it("should return 0 with an empty cart", () => {
      const state: RootState = {
        cart: { checkoutState: "READY", errorMessage: "", items: {} },
        products: { products: {} },
      };
      const result = getTotalPrice(state);
      expect(result).toEqual("0.00");
    });
    it("should add up the totals", () => {
      const state: RootState = {
        cart: {
          checkoutState: "READY",
          errorMessage: "",
          items: {
            [products[0].id]: 3,
            [products[1].id]: 4,
          },
        },
        products: {
          products: {
            [products[0].id]: products[0],
            [products[1].id]: products[1],
          },
        },
      };
      const result = getTotalPrice(state);
      expect(result).toEqual("43.23");
    });
    it("should not compute again with the same state", () => {
      const state: RootState = {
        cart: {
          checkoutState: "READY",
          errorMessage: "",
          items: {
            [products[0].id]: 3,
            [products[1].id]: 4,
          },
        },
        products: {
          products: {
            [products[0].id]: products[0],
            [products[1].id]: products[1],
          },
        },
      };
      getTotalPrice.resetRecomputations();
      const result = getTotalPrice(state);
      expect(result).toEqual("43.23");
      expect(getTotalPrice.recomputations()).toEqual(1);
      getTotalPrice(state);
      expect(getTotalPrice.recomputations()).toEqual(1);
    });
    it("should recompute with new products", () => {
      const state: RootState = {
        cart: {
          checkoutState: "READY",
          errorMessage: "",
          items: {
            [products[0].id]: 3,
            [products[1].id]: 4,
          },
        },
        products: {
          products: {
            [products[0].id]: products[0],
            [products[1].id]: products[1],
          },
        },
      };
      getTotalPrice.resetRecomputations();
      let result = getTotalPrice(state);
      expect(result).toEqual("43.23");
      expect(getTotalPrice.recomputations()).toEqual(1);
      state.products.products = {
        [products[0].id]: products[0],
        [products[1].id]: products[1],
        [products[2].id]: products[2],
      };
      result = getTotalPrice({ ...state });
      expect(result).toEqual("43.23");
      expect(getTotalPrice.recomputations()).toEqual(2);
    });
    it("should recompute when cart changes", () => {
      const state: RootState = {
        cart: {
          checkoutState: "READY",
          errorMessage: "",
          items: {
            [products[0].id]: 3,
            [products[1].id]: 4,
          },
        },
        products: {
          products: {
            [products[0].id]: products[0],
            [products[1].id]: products[1],
          },
        },
      };
      getTotalPrice.resetRecomputations();
      let result = getTotalPrice(state);
      expect(result).toEqual("43.23");
      expect(getTotalPrice.recomputations()).toEqual(1);
      state.cart.items = {};
      result = getTotalPrice({ ...state });
      expect(result).toEqual("0.00");
      expect(getTotalPrice.recomputations()).toEqual(2);
    });
  });
});
