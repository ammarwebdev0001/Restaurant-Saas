import { UserRole, CatProduct } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Decimal from 'decimal.js';



export function fakeUser() {
  return {
    name: faker.person.fullName(),
    username: faker.internet.userName(),
    email: undefined,
    emailVerified: undefined,
    image: undefined,
    password: undefined,
    role: faker.lorem.words(5),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeUserComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    username: faker.internet.userName(),
    email: undefined,
    emailVerified: undefined,
    image: undefined,
    password: undefined,
    role: faker.lorem.words(5),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeRole() {
  return {
    name: faker.person.fullName(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeRoleComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    restaurantId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakePermission() {
  return {
    name: faker.person.fullName(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakePermissionComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    roleId: undefined,
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeRestaurant() {
  return {
    name: faker.person.fullName(),
    slug: faker.lorem.words(5),
    subdomain: faker.lorem.words(5),
    logoUrl: undefined,
    logoKey: undefined,
    updatedAt: faker.date.anytime(),
  };
}
export function fakeRestaurantComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    slug: faker.lorem.words(5),
    subdomain: faker.lorem.words(5),
    logoUrl: undefined,
    logoKey: undefined,
    ownerId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeEmployee() {
  return {
    updatedAt: faker.date.anytime(),
  };
}
export function fakeEmployeeComplete() {
  return {
    id: faker.string.uuid(),
    restaurantId: faker.string.uuid(),
    userId: faker.string.uuid(),
    roleId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuCategory() {
  return {
    name: faker.person.fullName(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuCategoryComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    restaurantId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuItem() {
  return {
    name: faker.person.fullName(),
    imageUrl: undefined,
    imageKey: undefined,
    price: faker.number.float(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuItemComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    imageUrl: undefined,
    imageKey: undefined,
    price: faker.number.float(),
    categoryId: faker.string.uuid(),
    restaurantId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeCustomer() {
  return {
    name: faker.person.fullName(),
    email: undefined,
    phone: faker.lorem.words(5),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeCustomerComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: undefined,
    phone: faker.lorem.words(5),
    restaurantId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeOrder() {
  return {
    status: faker.lorem.words(5),
    total: faker.number.float(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeOrderComplete() {
  return {
    id: faker.string.uuid(),
    restaurantId: faker.string.uuid(),
    customerId: undefined,
    status: faker.lorem.words(5),
    total: faker.number.float(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeOrderItem() {
  return {
    quantity: faker.number.int(),
    price: faker.number.float(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeOrderItemComplete() {
  return {
    id: faker.string.uuid(),
    orderId: faker.string.uuid(),
    menuItemId: faker.string.uuid(),
    quantity: faker.number.int(),
    price: faker.number.float(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakePayment() {
  return {
    amount: faker.number.float(),
    status: faker.lorem.words(5),
    method: faker.lorem.words(5),
    updatedAt: faker.date.anytime(),
  };
}
export function fakePaymentComplete() {
  return {
    id: faker.string.uuid(),
    orderId: faker.string.uuid(),
    amount: faker.number.float(),
    status: faker.lorem.words(5),
    method: faker.lorem.words(5),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
    restaurantId: undefined,
  };
}
export function fakeProductStock() {
  return {
    name: faker.person.fullName(),
    imageProduct: undefined,
    price: faker.number.float(),
    stock: faker.number.float(),
    cat: faker.helpers.arrayElement([CatProduct.ELECTRO, CatProduct.DRINK, CatProduct.FOOD, CatProduct.FASHION] as const),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeProductStockComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    imageProduct: undefined,
    price: faker.number.float(),
    stock: faker.number.float(),
    cat: faker.helpers.arrayElement([CatProduct.ELECTRO, CatProduct.DRINK, CatProduct.FOOD, CatProduct.FASHION] as const),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeProduct() {
  return {
    sellprice: faker.number.float(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeProductComplete() {
  return {
    id: faker.string.uuid(),
    productId: faker.string.uuid(),
    sellprice: faker.number.float(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeOnSaleProduct() {
  return {
    quantity: faker.number.int(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeOnSaleProductComplete() {
  return {
    id: faker.string.uuid(),
    productId: faker.string.uuid(),
    quantity: faker.number.int(),
    saledate: new Date(),
    transactionId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeTransaction() {
  return {
    totalAmount: undefined,
    updatedAt: faker.date.anytime(),
  };
}
export function fakeTransactionComplete() {
  return {
    id: faker.string.uuid(),
    totalAmount: undefined,
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
    isComplete: false,
  };
}
export function fakeShopData() {
  return {
    tax: undefined,
    name: undefined,
    updatedAt: faker.date.anytime(),
  };
}
export function fakeShopDataComplete() {
  return {
    id: faker.string.uuid(),
    tax: undefined,
    name: undefined,
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
