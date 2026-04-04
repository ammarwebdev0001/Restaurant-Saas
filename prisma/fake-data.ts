import { UserRole, AttributeSelectionType, SubscriptionPlan, SubscriptionStatus, CatProduct } from '@prisma/client';
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
    role: UserRole.UNKNOW,
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
    mainBannerUrl: undefined,
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
    mainBannerUrl: undefined,
    menuBannerUrls: [],
    ownerId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeBranch() {
  return {
    name: faker.person.fullName(),
    address: undefined,
    phone: undefined,
    updatedAt: faker.date.anytime(),
  };
}
export function fakeBranchComplete() {
  return {
    id: faker.string.uuid(),
    restaurantId: faker.string.uuid(),
    name: faker.person.fullName(),
    address: undefined,
    phone: undefined,
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeRestaurantSubscription() {
  return {
    trialEndsAt: undefined,
    currentPeriodEnd: undefined,
    notes: undefined,
    updatedAt: faker.date.anytime(),
  };
}
export function fakeRestaurantSubscriptionComplete() {
  return {
    id: faker.string.uuid(),
    restaurantId: faker.string.uuid(),
    plan: SubscriptionPlan.STARTER,
    status: SubscriptionStatus.TRIAL,
    trialEndsAt: undefined,
    currentPeriodEnd: undefined,
    notes: undefined,
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakePlatformSetting() {
  return {
    key: faker.lorem.words(5),
    value: faker.lorem.words(5),
    updatedAt: faker.date.anytime(),
  };
}
export function fakePlatformSettingComplete() {
  return {
    id: faker.string.uuid(),
    key: faker.lorem.words(5),
    value: faker.lorem.words(5),
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
    description: undefined,
    imageUrl: undefined,
    imageKey: undefined,
    price: faker.number.float(),
    salePrice: undefined,
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuItemComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    description: undefined,
    imageUrl: undefined,
    imageKey: undefined,
    price: faker.number.float(),
    salePrice: undefined,
    categoryId: faker.string.uuid(),
    restaurantId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuItemOffer() {
  return {
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuItemOfferComplete() {
  return {
    id: faker.string.uuid(),
    baseItemId: faker.string.uuid(),
    offeredItemId: faker.string.uuid(),
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuItemAttributeGroup() {
  return {
    name: faker.person.fullName(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeMenuItemAttributeGroupComplete() {
  return {
    id: faker.string.uuid(),
    menuItemId: faker.string.uuid(),
    name: faker.person.fullName(),
    sortOrder: 0,
    selectionType: AttributeSelectionType.SINGLE,
    required: false,
    linkedCategoryId: faker.string.uuid(),
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
export function fakeOrderItemModifier() {
  return {
    name: faker.person.fullName(),
    unitPrice: faker.number.float(),
    updatedAt: faker.date.anytime(),
  };
}
export function fakeOrderItemModifierComplete() {
  return {
    id: faker.string.uuid(),
    orderItemId: faker.string.uuid(),
    menuItemId: faker.string.uuid(),
    name: faker.person.fullName(),
    unitPrice: faker.number.float(),
    quantity: 1,
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
