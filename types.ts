type user = 'customer' | 'kitchen' | 'server' | 'owner';

interface table {
tableNumber: number;
seats: number;
}

interface menuItem {
id: string;
name: string;
description: string;
price: number;
category: 'appetizer' | 'main' | 'dessert' | 'beverage';
isAvailable: boolean;
}

interface tableOrder {
orderId: string;
tableNumber: number;
items: { menuItemId: string; quantity: number }[];
status: 'pending' | 'in preparation' | 'served' | 'paid';
totalAmount: number;
}

interface staffMember {
id: string;
name: string;
role: user;
shiftStart: Date;
shiftEnd: Date;
}

export { user, table, menuItem, tableOrder, staffMember };

