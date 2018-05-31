let mongo = new Mongo()
let db = mongo.getDB("test")
let videos_c = db["youtube-videos-us"]
let videos_emb_c = db["youtube-videos-embedded-us"]
let categories_emb_c = db["youtube-categories-embedded-us"]
let categories_c = db["youtube-categories-us"]

// Create descending index on views
videos_c.createIndex({views: -1})