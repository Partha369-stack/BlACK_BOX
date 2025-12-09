
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  slot: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}
