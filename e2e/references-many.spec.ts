import { TestServer } from './test-server';
import { Image, Product, Tag, Variant } from '../src/models';

const server = TestServer.init({
  definitions: [Product, Tag, Variant, Image],
});

describe('References many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  const preExistingTags: Tag[] = [];

  beforeAll(async () => {
    const names = ['70s', '80s'];
    for (const name of names) {
      const { createTag } = await server.makeSuccessRequest({
        query: `
          mutation CreateTag($input: CreateTagInput!) {
            createTag(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            name,
          },
        },
      });
      preExistingTags.push(createTag);
    }
  });

  it('Create product with tags', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
            tagIds
            tags {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product',
          tagIds: preExistingTags.map((tag) => tag.id),
          tags: [{ name: '90s' }],
        },
      },
    });

    expect(response.createProduct).toEqual({
      id: expect.any(String),
      name: 'Awesome product',
      tagIds: expect.arrayContaining(preExistingTags.map((tag) => tag.id)),
      tags: [
        ...preExistingTags,
        {
          id: expect.any(String),
          name: '90s',
        },
      ],
    });
  });

  it('Create product without tags', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
            tagIds
            tags {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product 2',
        },
      },
    });

    expect(response.createProduct).toEqual({
      id: expect.any(String),
      name: 'Awesome product 2',
      tagIds: [],
      tags: [],
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
