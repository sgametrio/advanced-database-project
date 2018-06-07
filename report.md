# Report progettino Complementi di Basi di Dati
---
### Demetrio Carrara 807894
---
## Dataset
[YouTube Trending Videos Statistics](https://www.kaggle.com/datasnaek/youtube-new/)
### Descrizione
Il dataset si divide in statistiche sui video e sulle categorie di 5 diverse nazioni. Ho preso in considerazione unicamente le statistiche degli Stati Uniti.

Le informazioni si raggruppano in due file che rappresentano:
* categorie: file JSON (~1 MB)
* video: file CSV (~50 MB)

Il file delle categorie contiene un unico grosso oggetto JSON che ha le informazioni rilevanti delle categorie molto annidate. Quindi l'import deve estrarre le informazioni dele categorie e portarle al livello superiore.

I campi rilevanti per le categorie sono:
* `id`: importante perchè è presente come reference nei video
* `title`: perchè distingue il contesto della categoria

Per i video invece:
* `title` titolo del video
* `channel_title` titolo del canale che ha pubblicato il video
* `category_id` reference alla categoria
* `trending_date` data in cui il video è stato registrato come `trending`
* `tags` aiutano a capire il contesto del video
* `views`, `likes`, `dislikes`, `comment_count` 

### Import
L'import dei dati è stato fatto direttamente con `mongoimport` e con uno script in NodeJS che utilizza il pacchetto ufficiale di `MongoDB` per interagire col database.

Prima di eseguire l'import vero e proprio vanno modificati e adattati: in particolare il campo `tags` nei video è scritto nel seguente formato `"tag1"|"tag2"|...|"tagN"` e chiaramente ha senso importarlo come un array `["tag1", "tag2", ..., "tagN"]`.

I comandi utilizzati per importare sono:
```shell
mongoimport -d test -c youtube-videos-us --drop --file USvideos.csv --type csv --headerline
mongoimport -d test -c youtube-category-us --drop --file US_category_id.json
```


### Modellazione
Ho deciso di eliminare tutti quei campi che non ho ritenuto importanti ai fini del progetto e che occupano solo spazio nel database. In particolare: 
* `description`
* `thumbnail_link`
* `comments_disabled`
* `ratings_disabled`
* `video_error_or_removed`

Questo può essere fatto in fase di import: una volta letto un campo da file, lo si elimina dagli oggetti e non lo si importa. Oppure può essere fatto post-import tramite:
```mongodb
db.collection.update({}, { $unset: {campoDaEliminare: 1}}, { multi:true })
```
Le date sono state trasformate da semplici campi stringa nel formato `DD.MM.YYYY` a ISODate per in modo che si possano facilmente utilizzare per operazioni elementari.

Un'altro esperimento è stato quello di fare embedding delle categorie all'interno dei video per confrontare le performance fra reference e embedding

## Queries
* #1: 10 video più visti
```mongodb
find({}).sort({ views: -1 }).limit(10)
```   
* #2: Per ogni categoria, il video più visto
```mongodb
aggregate([
    {
        $sort: { "views": -1 }
    },
    {
        $group: {
            "_id": { "category": "$category.snippet.title" },
            "most_viewed_video": { $first: "$$ROOT" }
        }
    },
    {
        $project: {
            "_id": 0,
            "category" : "$_id.category",
            "most_viewed_video": {
                "title": 1,
                "views": 1
            }
        }
    }
])
```
* #3: Categorie che hanno una media di commenti ai video maggiore di 10000
```mongodb
aggregate([
    {
        $group: {
            "_id": "$category.snippet.title",
            "avg_comments": { $avg: "$comment_count" }
        }
    },
    {
        $match: {
            "avg_comments": { $gt: 10000 }
        }
    }
])
```      
* #4: Per ogni categoria e ogni giorno, i video con più tag
```mongodb    
aggregate([{
    $project: {
        "category": 1,
        "trending_date": 1,
        "title": 1,
        "tags_count": { $size: { "$ifNull": [ "$tags", [] ] }}
    }
},
{
    $sort: { "tags_count": -1}
},
{
    $group: {
        "_id": { category: "$category.snippet.title", date: "$trending_date" },
        "most_tagged_video": { $first: "$$ROOT" }
    }
},
{
    $project: {
        "_id": 0,
        "category": "$_id.category",
        "date": "$_id.date",
        "most_tagged_video": {
            "title": 1,
            "tags_count": 1
        }
    }
},
{
    $sort: {
        "date": -1
    }
}]);
```      
* #5: Categorie con meno di 5000 video ordinati in modo ascendente
```mongodb
aggregate([
    {
        $group: {
            "_id": "$category.snippet.title",
            "videos_count": { $sum: 1 }
        }
    },
    {
        $match: {
            "videos_count": { $lt: 5000 }
        }
    },
    {
        $sort: {
            "videos_count": 1
        }
    }
])
```     
La differenza sostanziale nelle query sulle collezioni collegati per reference è che il primo passo della `aggregate` è fare la `$lookup` delle categorie in questo modo:
```mongodb
$lookup: { 
    from: "youtube-videos-us",
    localField: "_id",
    foreignField: "category_id",
    as:"videos" 
}
```
## Confronto performance sulle queries
Per migliorare le performance, sono stati costruiti degli indici. In particolare: 
* indice ascendente su `category_id` dei video per una maggiore efficienza del `$lookup` sul reference delle categorie
* indice discendente su `views` per permettere una maggiore efficienza dell'ordinamento per visualizzazioni

I risultati evidenziati sono su video collegati alle categorie per reference
| # query | Senza indici | Con indici |
| ------- | ------------ | ---------- |
| 1       | 46ms         | 1ms        |
| 2       | 841ms        | 261ms      |
| 3       | 769ms        | 201ms      |
| 4       | 890ms        | 316ms      |
| 5       | 761ms        | 195ms      |

## Confronto queries reference vs. embedding (senza indici)
| # query | reference | embedding |
| ------- | --------- | --------- |
| 1       | 46ms      | 51ms      |
| 2       | 841ms     | 261ms     |
| 3       | 769ms     | 60ms      |
| 4       | 890ms     | 250ms     |
| 5       | 761ms     | 52ms      |