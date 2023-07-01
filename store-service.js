const fs = require('fs');

let items = [];
let categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/items.json', 'utf8', (err, itemsData) => {
      if (err) {
        reject('Unable to read items file');
        return;
      }

      try {
        items = JSON.parse(itemsData);
      } catch (parseError) {
        reject('Unable to parse items file');
        return;
      }

      fs.readFile('./data/categories.json', 'utf8', (err, categoriesData) => {
        if (err) {
          reject('Unable to read categories file');
          return;
        }

        try {
          categories = JSON.parse(categoriesData);
        } catch (parseError) {
          reject('Unable to parse categories file');
          return;
        }

        resolve();
      });
    });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject('No items available');
      return;
    }

    resolve(items);
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published);

    if (publishedItems.length === 0) {
      reject('No published items available');
      return;
    }

    resolve(publishedItems);
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject('No categories available');
      return;
    }

    resolve(categories);
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    if (itemData.published === undefined) {
      itemData.published = false;
    } else {
      itemData.published = true;
    }

    itemData.id = items.length + 1;

    items.push(itemData);
    resolve(itemData);
  });
}

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter((item) => String(item.category) === String(category));
    if (filteredItems.length === 0) {
      reject("No results returned");
    } else {
      resolve(filteredItems);
    }
  });
}


function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(
      (item) => new Date(item.postDate) >= new Date(minDateStr)
    );
    if (filteredItems.length === 0) {
      reject("No results returned");
    } else {
      resolve(filteredItems);
    }
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    const item = items.find((item) => item.id.toString() === id);
    if (!item) {
      reject("No result returned");
    } else {
      resolve(item);
    }
  });
}
function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published);

    if (publishedItems.length === 0) {
      reject('No published items available');
      return;
    }

    resolve(publishedItems);
  });
}
function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => (item.category === category && item.published === true));

    if (publishedItems.length === 0) {
      reject('No published items available');
      return;
    }

    resolve(publishedItems);
  });
}

module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory
};
