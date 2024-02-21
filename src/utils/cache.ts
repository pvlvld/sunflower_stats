import { LRUCache } from "lru-cache";

const options = {
  max: 100,
  updateAgeOnGet: true,
};
const cache = new LRUCache(options);

export default cache;
