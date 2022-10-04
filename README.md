## Usage

```js
export const client = new PrintifyClient({
  apiKey: process.env.PRINTIFY_API_KEY,
  shopId: process.env.PRINTIFY_SHOP_ID,
});
```

## Actual code

```js
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
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    if (response.ok) {
      return await response.json();
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
```

# TSDX User Guide

Congrats! You just saved yourself hours of work by bootstrapping this project with TSDX. Let’s get you oriented with what’s here and how to use it.

> This TSDX setup is meant for developing libraries (not apps!) that can be published to NPM. If you’re looking to build a Node app, you could use `ts-node-dev`, plain `ts-node`, or simple `tsc`.

> If you’re new to TypeScript, checkout [this handy cheatsheet](https://devhints.io/typescript)

## Commands

TSDX scaffolds your new library inside `/src`.

To run TSDX, use:

```bash
npm start # or yarn start
```

This builds to `/dist` and runs the project in watch mode so any edits you save inside `src` causes a rebuild to `/dist`..

To do a one-off build, use `npm run build` or `yarn build`.

To run tests, use `npm test` or `yarn test`.

## Configuration

Code quality is set up for you with `prettier`, `husky`, and `lint-staged`. Adjust the respective fields in `package.json` accordingly.

### Jest

Jest tests are set up to run with `npm test` or `yarn test`.

### Bundle Analysis

[`size-limit`](https://github.com/ai/size-limit) is set up to calculate the real cost of your library with `npm run size` and visualize the bundle with `npm run analyze`.

#### Setup Files

This is the folder structure we set up for you:

```txt
/src
  index.tsx       # EDIT THIS
/test
  blah.test.tsx   # EDIT THIS
.gitignore
package.json
README.md         # EDIT THIS
tsconfig.json
```

### Rollup

TSDX uses [Rollup](https://rollupjs.org) as a bundler and generates multiple rollup configs for various module formats and build settings. See [Optimizations](#optimizations) for details.

### TypeScript

`tsconfig.json` is set up to interpret `dom` and `esnext` types, as well as `react` for `jsx`. Adjust according to your needs.

## Continuous Integration

### GitHub Actions

Two actions are added by default:

- `main` which installs deps w/ cache, lints, tests, and builds on all pushes against a Node and OS matrix
- `size` which comments cost comparison of your library on every pull request using [`size-limit`](https://github.com/ai/size-limit)

## Optimizations

Please see the main `tsdx` [optimizations docs](https://github.com/palmerhq/tsdx#optimizations). In particular, know that you can take advantage of development-only optimizations:

```js
// ./types/index.d.ts
declare var __DEV__: boolean;

// inside your code...
if (__DEV__) {
  console.log('foo');
}
```

You can also choose to install and use [invariant](https://github.com/palmerhq/tsdx#invariant) and [warning](https://github.com/palmerhq/tsdx#warning) functions.

## Module Formats

CJS, ESModules, and UMD module formats are supported.

The appropriate paths are configured in `package.json` and `dist/index.js` accordingly. Please report if any issues are found.

## Named Exports

Per Palmer Group guidelines, [always use named exports.](https://github.com/palmerhq/typescript#exports) Code split inside your React app instead of your React library.

## Including Styles

There are many ways to ship styles, including with CSS-in-JS. TSDX has no opinion on this, configure how you like.

For vanilla CSS, you can include it at the root directory and add it to the `files` section in your `package.json`, so that it can be imported separately by your users and run through their bundler's loader.

## Publishing to NPM

We recommend using [np](https://github.com/sindresorhus/np).
