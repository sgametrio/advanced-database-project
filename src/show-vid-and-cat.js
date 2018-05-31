let mongo = new Mongo()
let db = mongo.getDB("test")
let videos_c = db["youtube-videos-us"]
let videos_emb_c = db["youtube-videos-embedded-us"]
let categories_c = db["youtube-categories-us"]
let categories_emb_c = db["youtube-categories-embedded-us"]
let cursor

print("videos")
cursor = videos_c.find({}).limit(1)
while (cursor.hasNext()) {
    printjson(cursor.next())
}

print("categories")
cursor = categories_c.find({}).limit(1)
while (cursor.hasNext()) {
    printjson(cursor.next())
}

print("videos-embedded")
cursor = videos_emb_c.find({}).limit(1)
while (cursor.hasNext()) {
    printjson(cursor.next())
}

print("categories-embedded")
cursor = categories_emb_c.find({}).limit(1)
while (cursor.hasNext()) {
    printjson(cursor.next())
}