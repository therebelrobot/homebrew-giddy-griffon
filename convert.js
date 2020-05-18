const objectro = require("objectro").default;
const _ = require("lodash");
const fs = require("fs");
const path = require("path");

const sourceItems = require("./source/item.json");
const parser = require("./5eToolsParser");

const defaultItemImage = {
  type: "image",
  href: {
    type: "external",
    url: null,
  },
};

const defaultCredits = {
  name: "Credits",
  type: "inset",
  entries: [
    "This item is part of the 'Griffon's Saddlebag', a growing collection of hundreds of items that are fun, flavorful, and ready for your campaign. For more items and access to exclusive extra's, you can support griffmac on his {@link website|https://www.thegriffonssaddlebag.com} or his {@link Patreon|https://www.patreon.com/the_griffons_saddlebag}.",
  ],
};

console.log("starting conversion");

const sourceItemTypes = {};
const sourceKeys = {};
const newObjects = Object.values(sourceItems).map((source) => {
  const objectKeys = Object.keys(source);
  objectKeys.forEach((key) => {
    sourceKeys[key] = true;
  });
  const newItem = objectro.transform(source, {
    id: "originalId",
    name: (value) => {
      const imageDefault = _.cloneDeep(defaultItemImage);
      return {
        name: value,
        pushTo_fluffImages_start: {
          ...imageDefault,
          href: {
            ...imageDefault.href,
            url: `https://${
              process.env.IMAGE_SOURCE
            }/Assets/By%20Artist%20or%20Source/The%20Griffon%27s%20Saddlebag/${encodeURIComponent(
              value.replace(/'/g, "’")
            )}.png`,
          },
        },
      };
    },
    description: (value) => {
      return {
        mergeTo_entries_start: value
          .split("\n")
          .filter((n) => n && n.length)
          .map(parser),
      };
    },
    flavour: (value) => {
      if (!value) return;
      return {
        mergeTo_fluffEntries_start: value
          .split("\n")
          .filter((n) => n && n.length)
          .map(parser),
      };
    },
    itemType: (value) => {
      sourceItemTypes[value] = true;
    },
    // 'attunement':
    // 'dateMonth':
    // 'dateYear':
    // 'free':
    // 'imageCount':
    // 'imageIds':
    // 'images':
    // 'patreonArtUrl':
    // 'patreonCardUrl':
    // 'rarities':
    // 'rarity':
    // 'significance':
    // 'tags':
    // 'itemSubtype':
  });

  newItem.fluff = newItem.fluff || { images: [], entries: [] };

  for (const key of Object.keys(newItem)) {
    if (!key.includes("pushTo") && !key.includes("mergeTo")) continue;
    const [type, field, direction] = key.split("_");

    let value = newItem[key];
    if (type === "mergeTo") {
      newItem[field] = newItem[field] || [];
      if (field === "fluffEntries") {
        newItem.fluff = newItem.fluff || { images: [], entries: [] };
        switch (direction) {
          case "start":
            newItem.fluff.entries = value.concat(newItem.fluff.entries);
            break;
          default:
            newItem.fluff.entries = newItem.fluff.entries.concat(value);
        }
        delete newItem[key];
        continue;
      }

      switch (direction) {
        case "start":
          newItem[field] = value.concat(newItem[field]);
          break;
        default:
          newItem[field] = newItem[field].concat(value);
      }
      delete newItem[key];

      continue;
    }

    if (field === "fluffImages") {
      newItem.fluff = newItem.fluff || { images: [], entries: [] };
      switch (direction) {
        case "start":
          newItem.fluff.images.unshift(value);
          break;
        default:
          newItem.fluff.images.push(value);
      }
      delete newItem[key];
      continue;
    }

    newItem[field] = newItem[field] || [];

    switch (direction) {
      case "start":
        newItem[field].unshift(value);
        break;
      default:
        newItem[field].push(value);
    }
    delete newItem[key];
  }

  newItem.fluff.entries.push(_.cloneDeep(defaultCredits));

  return {
    source: "TGS",
    name: newItem.name,
    entries: newItem.entries,
    fluff: newItem.fluff,
    ...newItem,
  };
});

console.log(Object.keys(sourceItemTypes));
console.log(Object.keys(sourceKeys));

console.log("starting write");

const finalBrew = {
  _meta: {
    sources: [
      {
        json: "TGS",
        abbreviation: "TGS",
        full: "The Griffon's Saddlebag",
        authors: ["/u/griff-mac"],
        convertedBy: ["aster", "mrvauxs", "fantom"],
        version: "1.0.0",
        url: "https://www.patreon.com/the_griffons_saddlebag",
        targetSchema: "1.0.0",
      },
    ],
    dateAdded: Date.now(),
    dateLastModified: Date.now(),
  },
  item: newObjects,
};
const outPath = path.resolve(
  __dirname,
  "./item/griff-mac; The Griffon's Saddlebag.json"
);
fs.writeFile(outPath, JSON.stringify(finalBrew, null, "  "), (err) => {
  if (err) throw err;
  console.log("write complete");
});
