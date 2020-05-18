// {
//   "attunement": false,
//   "dateMonth": 5,
//   "dateYear": 2019,
//   "description": "This ring is made entirely of sand that ebbs and flows around your finger. The sand is magically held together by a single, perfectly smooth tiger's eye stone that spins in place as the sand brushes past it. While you wear this ring, you leave no footprints behind when you walk in sand and treat all nonmagical difficult terrain in sand as if it were normal terrain.",
//   "flavour": "Worn by the H'rethi Reach nomads, you'll never know they're there until it's too late.",
//   "free": false,
//   "imageCount": 1,
//   "imageIds": ["d_n6U8gT"],
//   "images": [
//     "Ring-of-the-Sandskimmer_No_Watercolor.png",
//     "Ring-of-the-Sandskimmer_Transparent_Background.png",
//     "Ring-of-the-Sandskimmer_No_Label.png",
//     "Ring-of-the-Sandskimmer_HiRez-Flat.png"
//   ],
//   "itemType": "Ring",
//   "name": "Ring of the Sandskimmer",
//   "patreonArtUrl": "https://www.patreon.com/posts/27502882",
//   "patreonCardUrl": "https://www.patreon.com/posts/27502883",
//   "rarities": ["uncommon"],
//   "rarity": "uncommon",
//   "significance": "major",
//   "id": "039uGrnuHR9YSAPqMCuk"
// }

// to

// {
//   "name": "Wand of the Weary",
//   "source": "ToT",
//   "rarity": "rare",
//   "reqAttune": "by a spellcaster",
//   "type": "WD",
//   "focus": true,
//   "weight": 1,
//   "recharge": "dusk",
//   "charges": 3,
//   "entries": [
//       "This wand has 3 charges. While holding it, you can use an action to prick your finger on one of the thorns and cast a spell of 1st level or higher you know. Doing so does not expend a spell slot and uses the wand as an arcane focus. The wand expends one charge per spell level. For each spell level over the amount of charges in the wand you gain one level of {@condition exhaustion}, to a maximum of 6. ",
//       "The wand regains {@dice 1d3} expended charges daily at dusk. If you expend the wand's last charge, it grows an additional thorn."
//   ],
//   "fluff": {
//       "images": [
//           {
//               "type": "image",
//               "href": {
//                   "type": "external",
//                   "url": "https://cdn.discordapp.com/attachments/620310613088010290/693236345048400022/Main.png"
//               }
//           }
//       ],
//       "entries": [
//           "This gnarled tree-root always feels heavy in your hand. Sharp thorns stick out of it at random.",
//           {
//               "name": "Credits",
//               "type": "inset",
//               "entries": [
//                   "This item is part of the 'Tavern of Trinkets', a growing collection of illustrated Magic Items created by Jelke Ludolphij. For more items and access to exclusive extra's, support me on {@link Patreon|https://www.patreon.com/trinkets}!"
//               ]
//           }
//       ]
//   }
// },

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
