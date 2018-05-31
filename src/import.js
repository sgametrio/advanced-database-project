// Import categories by doing a remodeling from:
// categories: {
//     items: [
//         {
//             "id": "wewe"
//             ...
//         },
//          ...
//     ]
// }
// 
// to:

// [
//     {
//         "_id": "wewe"
//     },
//     ...
// ]

const mongodb = require("mongodb").MongoClient
const csv = require('csvtojson')
let Time = require('time-diff');
// Connection parameters
const url = "mongodb://localhost:27017";
const dbName = "test";

function importCategories(db) {
    const categories_dataset_file = "US_category_id.json"
    let categories_coll = db.collection("youtube-categories-us")
    categories_coll.drop().then((result) => {
        console.log("youtube-categories-us dropped")
    }).catch((error) => console.log("youtube-categories-us already dropped"))

    let time = new Time()
    time.start("import_categories")
    let categories_file = require(`../dataset/${categories_dataset_file}`)
    // Copy `id` field over `_id`
    for (let category of categories_file.items) {
        category._id = category.id
        delete category.id
    }
    return categories_coll.insertMany(categories_file.items).then((result) => {
        console.log(`Inserted ${result.insertedCount} categories: ${time.end("import_categories")}`)
    })
}

function importVideos(db, collection = "youtube-videos-us") {
    let videos_coll = db.collection(collection)
    videos_coll.drop().then((result) => {
        console.log(`${collection} dropped`)
    }).catch((error) => console.log(`${collection} already dropped`))
    let time = new Time()
    time.start("import_videos")
    const videos_dataset_file = "USvideos.csv"
    return csv()
        .fromFile(`dataset/${videos_dataset_file}`)
        .then((jsonObj) => {
            for (obj of jsonObj) {
                obj.views = parseInt(obj.views)
                obj.comment_count = parseInt(obj.comment_count)
                obj.likes = parseInt(obj.likes)
                obj.dislikes = parseInt(obj.dislikes)
                delete obj.description // si poteva fare anche con update({}, {$unset: {description: 1}}, {multi:true})
                let tags_string = obj.tags
                let tags = []
                for (let tag of tags_string.split("|")) {
                    // remove double quote at the beginning and at the end
                    if (tag[0] === "\"")
                        tag = tag.substring(1)
                    if (tag[tag.length - 1] == "\"")
                        tag = tag.substring(0, tag.length - 1)
                    tags.push(tag)
                }
                obj.tags = tags

            }
            return videos_coll.insertMany(jsonObj).then((result) => {
                console.log(`Inserted ${result.insertedCount} videos: ${time.end("import_videos")}`)
            }).catch((error) => console.log(error))
        }).catch((error) => console.log(error))
}

// Use connect method to connect to the server
mongodb.connect(url, function (err, client) {
    if (err !== null) {
        return
    }
    console.log("Connected successfully to server")
    const db = client.db(dbName)
    importCollections = async (db) => {
        await importCategories(db)
        await importVideos(db)
    }

    embedCategories = async (db) => {
        let time = new Time()
        time.start("import_embedded")
        await importVideos(db, "youtube-videos-embedded-us")
        let cursor_c = db.collection("youtube-categories-us").find({})
        let categories = []
        while(await cursor_c.hasNext()) {
            const cat = await cursor_c.next()
            categories.push(cat)
        }
        let videos = db.collection("youtube-videos-embedded-us")
        let cursor_v = videos.find({})
        while(await cursor_v.hasNext()) {
            let vid = await cursor_v.next()
            videos.updateOne(vid, { $set: { category: categories.find((element) => {
                return element._id === vid.category_id
            })}})
        }
        console.log(`Imported embedded categories into videos: ${time.end("import_embedded")}`)
    }

    runQueries = async (db) => {
        let cursor, time
        // First 10 videos with more views
        time = new Time()
        time.start("most_viewed_sort")
        cursor = db.collection("youtube-videos-us").find({}).project({title: 1, views: 1}).sort({ views: -1 }).limit(10)
        while (await cursor.hasNext()) {
            let doc = await cursor.next()
            console.log(doc)
        }
        console.log(time.end("most_viewed_sort"))

        time.start("most_viewed_order_by")
        cursor = db.collection("youtube-videos-us").find({}).project({title: 1, views: 1}).
        addQueryModifier('$orderby', {views:-1}).limit(10)
        while (await cursor.hasNext()) {
            let doc = await cursor.next()
            console.log(doc)
        }
        console.log(time.end("most_viewed_order_by"))
        // For each category, most viewed video

        // Videos with almost n comments

        // Categories, with less than n videos

        // Categories by number of videos
    }

    importCollections(db).then((response) => {
        embedCategories(db).then((response) => {
            //runQueries(db).then((response) => {
                client.close()
            //})
        })
    })
    
});