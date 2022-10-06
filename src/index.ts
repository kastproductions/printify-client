import fetch from 'node-fetch';
const BASE_URL = 'https://api.printify.com/v1';

type Shops = {
  id: string;
  title: string;
  sales_channel: string;
};

type Product = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: { name: string }[];
  variants: { id: string }[];
  images: { src: string }[];
};

type Products = {
  current_page: string;
  data: Product[];
};

type CreateOrderItem = {
  external_id: string;
  // label: string;
  line_items: [
    {
      product_id: string;
      variant_id: number;
      quantity: number;
    }
  ];
  shipping_method: number;
  send_shipping_notification: boolean;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: '';
    address1: string;
    address2: string;
    city: string;
    zip: string;
  };
};

type OrderToProduction = {
  line_items: Record<string, any>[];
  address_to: Record<string, any>;
};

type Options = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: string;
  // mode?: string;
};

// order:created
// order:sent-to-production
// order:shipment:created
// order:shipment:delivered

type Topics =
  | 'order:created'
  | 'order:sent-to-production'
  | 'order:shipment:created'
  | 'order:shipment:delivered';

export default class PrintifyClient {
  private apiKey: string;
  private shopId?: number | string;

  constructor({
    shopId,
    apiKey,
  }: {
    shopId?: number | string;
    apiKey: string;
  }) {
    this.apiKey = apiKey;
    this.shopId = shopId;
  }

  protected async invoke<T>(
    endpoint: string,
    options: Options = { method: 'GET' }
  ): Promise<T> {
    const response = await fetch(BASE_URL + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    if (response.ok) {
      const result = (await response.json()) as T;
      return result;
    } else {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  }

  public async getShops(): Promise<Shops[]> {
    return await this.invoke<Shops[]>(`/shops.json`);
  }

  public async createWebhooks(
    topics: { topic: Topics; url: string; secret: string }[]
  ): Promise<unknown> {
    const promises = topics.map(({ topic, url, secret }) => {
      return this.invoke(`/shops/${this.shopId}/webhooks.json`, {
        method: 'POST',
        body: JSON.stringify({
          topic,
          url,
          secret,
        }),
      });
    });
    return Promise.all(promises);
  }

  public async deleteWebhook(id: string): Promise<unknown> {
    return this.invoke(`/shops/${this.shopId}/webhooks/${id}.json`, {
      method: 'DELETE',
    });
  }

  public async getWebhooks(): Promise<Record<string, string>[]> {
    return this.invoke(`/shops/${this.shopId}/webhooks.json`);
  }

  public async getProducts(): Promise<Products> {
    return await this.invoke<Products>(
      `/shops/${this.shopId}/products.json?limit=100`
    );
  }
  public async getProduct(productId: string): Promise<Products> {
    return await this.invoke<Products>(
      `/shops/${this.shopId}/products/${productId}.json`
    );
  }
  public async createOrder(order: CreateOrderItem): Promise<{ id: string }> {
    return await this.invoke<{ id: string }>(
      `/shops/${this.shopId}/orders.json`,
      {
        method: 'POST',
        body: JSON.stringify(order),
      }
    );
  }
  public async sendOrderToProduction(
    orderId: string
  ): Promise<OrderToProduction> {
    return await this.invoke<OrderToProduction>(
      `/shops/${this.shopId}/orders/${orderId}/send_to_production.json`,
      {
        method: 'POST',
      }
    );
  }
  public async publish(productId: string): Promise<OrderToProduction> {
    return await this.invoke<OrderToProduction>(
      `/shops/${this.shopId}/products/${productId}/publish.json`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: true,
          description: true,
          images: true,
          variants: true,
          tags: true,
        }),
      }
    );
  }
  public async unpublish(productId: string): Promise<OrderToProduction> {
    return await this.invoke<OrderToProduction>(
      `/shops/${this.shopId}/products/${productId}/unpublish.json`,
      {
        method: 'POST',
      }
    );
  }
  public async setPublishStatusFailed(
    productId: string
  ): Promise<OrderToProduction> {
    return await this.invoke<OrderToProduction>(
      `/shops/${this.shopId}/products/${productId}/publishing_failed.json`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Request timed out',
        }),
      }
    );
  }
  public async setPublishStatusSucceeded({
    productId,
    handle,
  }: {
    productId: string;
    handle?: string;
  }): Promise<OrderToProduction> {
    return await this.invoke<OrderToProduction>(
      `/shops/${this.shopId}/products/${productId}/publishing_succeeded.json`,
      {
        method: 'POST',
        body: JSON.stringify({
          external: {
            id: productId,
            handle:
              handle ?? `https://example.com/path/to/product/${productId}`,
          },
        }),
      }
    );
  }
}
