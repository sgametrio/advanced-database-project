let mongo = new Mongo()
let db = mongo.getDB("test")
let videos_c = db["youtube-videos-us"]
let videos_emb_c = db["youtube-videos-embedded-us"]
let categories_emb_c = db["youtube-categories-embedded-us"]
let categories_c = db["youtube-categories-us"]

videos_c.dropIndexes()
videos_emb_c.dropIndexes()
categories_c.dropIndexes()
categories_emb_c.dropIndexes()