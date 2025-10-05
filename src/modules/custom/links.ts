export const linkDefinitions = [
  {
    name: "custom-product-link",
    from: "custom",       // module name
    to: "product",        // core product module
    fromKey: "id",        // matches Custom model primary key
    toKey: "product_id",  // matches Custom model column
  },
]