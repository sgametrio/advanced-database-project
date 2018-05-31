let mongo = new Mongo()
let db = mongo.getDB("test")
let videos_c = db["youtube-videos-us"]
let videos_emb_c = db["youtube-videos-embedded-us"]
let categories_emb_c = db["youtube-categories-embedded-us"]
let categories_c = db["youtube-categories-us"]

// Remove description field because it's heavy and useless for us
//videos_c.update({}, { $unset: { "description": 1 }}, { multi: true })
//videos_emb_c.update({}, { $unset: { "description": 1 }}, { multi: true })
