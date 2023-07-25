const Sequelize = require('sequelize');
var sequelize = new Sequelize('yecuraac', 'yecuraac', 'Cf7iu2mqMmzSy-VjCudnNNRvkWuK6Tny', {
    host: 'stampy.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        console.log('Database connection and synchronization successful.');
        resolve();
      })
      .catch(err => {
        console.error('Unable to sync the database:', err);
        reject('Unable to sync the database');
      });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Error retrieving items:', err);
        reject('No results returned');
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(categories => {
        if (categories.length > 0) {
          resolve(categories);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Error retrieving categories:', err);
        reject('No results returned');
      });
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {

    itemData.published = !!itemData.published;

    for (const prop in itemData) {
      if (itemData[prop] === "") {
        itemData[prop] = null;
      }
    }

    itemData.postDate = new Date();

    Item.create(itemData)
      .then(() => {
        resolve();
      })
      .catch(err => {
        console.error('Error adding item:', err);
        reject('Unable to create post');
      });
  });
}

function getItemsByCategory(categoryId) {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { category: categoryId } })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Error retrieving items by category:', err);
        reject('No results returned');
      });
  });
}


function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const { Op } = require('sequelize');
    Item.findAll({ where: { postDate: { [Op.gte]: new Date(minDateStr) } } })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Error retrieving items by minimum date:', err);
        reject('No results returned');
      });
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { id: id } })
      .then(items => {
        if (items.length > 0) {
          resolve(items[0]);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Error retrieving item by ID:', err);
        reject('No results returned');
      });
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true } })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Error retrieving published items:', err);
        reject('No results returned');
      });
  });
}

function getPublishedItemsByCategory(categoryId) {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { category: categoryId, published: true } })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Error retrieving published items by category:', err);
        reject('No results returned');
      });
  });
}

function addCategory(categoryData) {
  for (const key in categoryData) {
    if (categoryData.hasOwnProperty(key) && categoryData[key] === "") {
      categoryData[key] = null;
    }
  }

  return new Promise((resolve, reject) => {
    Category.create(categoryData)
      .then(() => {
        resolve('Category created successfully');
      })
      .catch(err => {
        console.error('Error creating category:', err);
        reject('Unable to create category');
      });
  });
}

function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({ where: { id } })
      .then(numDeleted => {
        if (numDeleted === 1) {
          resolve('Category deleted successfully');
        } else {
          reject('Category not found');
        }
      })
      .catch(err => {
        console.error('Error deleting category:', err);
        reject('Unable to remove category');
      });
  });
}

function deletePostById(id) {
  return new Promise((resolve, reject) => {
    Item.destroy({ where: { id } })
      .then(numDeleted => {
        if (numDeleted === 1) {
          resolve('Post deleted successfully');
        } else {
          reject('Post not found');
        }
      })
      .catch(err => {
        console.error('Error deleting post:', err);
        reject('Unable to remove post');
      });
  });
}

var Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,  
  postDate: Sequelize.DATE, 
  featureImage: Sequelize.STRING, 
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

var Category = sequelize.define('Category', {
  category: Sequelize.TEXT
});

Item.belongsTo(Category, {foreignKey: 'category'});

module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
};
