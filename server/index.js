const dotenv = require('dotenv');
const speech = require('@google-cloud/speech');
const docSimilarity = require('doc-similarity');
const profanityHindi = require('profanity-hindi');
const { Comprehend } = require("@aws-sdk/client-comprehend");
const authRoutes = require('./login');
dotenv.config();
require('./db');
console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)
const express = require('express')
const multer = require('multer');
var jwt = require('express-jwt');
var cors = require('cors')

const app = express()
const port = 3001

app.use(require('serve-static')(__dirname + '/../../public'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(cors())

// const { Readable } = require('stream');
const client = new speech.SpeechClient();
const inMemoryStorage = multer.memoryStorage()
const uploadStrategy = multer({ storage: inMemoryStorage }).single('file')

const comprehend = new Comprehend({ region: 'us-east-2' })

async function transcribeAudioHindi(audio){
    let request = {};
    const config = {
        languageCode: 'hi-IN',
        speechContexts: [{
            phrases: ["Teekona", "Broadband"],
            boost: 10.0
        }],
        // {
        //     phrases: ["tikona broadband"],
        //     boost: 10.0
        // }]
    };
    request.audio = {
        content: audio
    };
    request.config = config;
    const responses = await client.recognize(request);
    return responses;
}


async function transcribeAudioEnglish(audio){
    let request = {};
    const config = {
        languageCode: 'en-IN',
        speechContexts: [{
            phrases: ["teekonaa", "broadband", "Idiot Insaan"],
            boost: 10.0
        }],
        // {
        //     phrases: ["tikona broadband"],
        //     boost: 10.0
        // }]
    };
    request.audio = {
        content: audio
    };
    request.config = config;
    const responses = await client.recognize(request);
    return responses;
}

const getSentimentFlag = async (transcriptionHindi) => {
    var params = {
        LanguageCode: 'hi',
        Text: transcriptionHindi
    };
    const sentiment = await comprehend.detectSentiment(params);
    console.log(sentiment)
    const { Mixed, Negative, Neutral, Positive } = sentiment;
    if (Negative > 0.8) {
        return { redFlag: 2, greenFlag: 0 };
    }
    if(Positive > 0.8) {
        return { redFlag: 0, greenFlag: 0 };
    }
    if(Neutral > 0.8) {
        return { redFlag: 0, greenFlag: 1 };
    }
    return { redFlag: 0, greenFlag: 0 };
}

const getSimilarityFlag = async (transcriptionHindi) => {
    const doc1 = "हैलो पंकज जी बात कर रहे हैं? जी मैं राहुल बात कर रहा हूं Teekona Broadband से। हमारी कंपनी बोहोत हाई स्पीड पर अनलिमिटेड डेटा प्रोवाइड कर ती है। हमारा सबसे कम पैक 15 एमबीपीएस का है और वो मोबाइल डेटा की स्पीड से 3-4 गुना तेज है";
    const similarityConfidence = docSimilarity.wordFrequencySim(doc1, transcriptionHindi, docSimilarity.cosineSim);
    if(similarityConfidence >= 0.5) {
        return { redFlag: 0, greenFlag: 1 };
    }
    if(similarityConfidence >= 0.2) {
        return { redFlag: 1, greenFlag: 0 }
    }
    return { redFlag: 2, greenFlag: 0 };
}

const getProfanityFlag = async (transcriptionHindi) => { var newWords = ["this", "dumbness"];
    profanityHindi.addWords(["kutta", "kamina"]);
    const inappropriateWordUsed = profanityHindi.isMessageDirty(transcriptionHindi);
    if(inappropriateWordUsed) {
        return { redFlag: 2, greenFlag: 0 };
    }
    return { redFlag: 0, greenFlag: 0 };
}

app.post('/upload', jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256']
  }), uploadStrategy, async (req, res) => {
    console.log(req["file"].buffer);
    const responseHindi = await transcribeAudioHindi(req["file"].buffer);
    const responseEnglish = await transcribeAudioEnglish(req["file"].buffer);
    // console.log(response.results)
    const transcriptionHindi = responseHindi[0].results
        .map(result => {
        console.log(result.alternatives)
            return result.alternatives[0].transcript
        })
        .join('\n');
    const transcriptionEnglish = responseEnglish[0].results
        .map(result => {
        console.log(result.alternatives)
            return result.alternatives[0].transcript
        })
        .join('\n');
    console.log(transcriptionEnglish)
    console.log(transcriptionHindi)
    let redFlagCount = 0, greenFlagCount = 0;
    const sentimentFlags = await getSentimentFlag(transcriptionHindi);
    const similarityFlags = await getSimilarityFlag(transcriptionHindi);
    const profanityFlags = await getProfanityFlag(transcriptionEnglish);
    redFlagCount += sentimentFlags.redFlag + similarityFlags.redFlag + profanityFlags.redFlag;
    greenFlagCount += sentimentFlags.greenFlag + similarityFlags.greenFlag + profanityFlags.greenFlag;
    console.log(greenFlagCount)
    console.log(redFlagCount)
    console.log({ sentimentFlags });
    console.log({ similarityFlags });
    console.log({ profanityFlags });
    let audioStatus = "Flagged";
    if(greenFlagCount > redFlagCount + 1) {
        audioStatus = "Pass";
    } else if(redFlagCount > greenFlagCount + 1) {
        audioStatus = "Fail";
    }
    console.log(audioStatus)
    res.status(200).send({ audioStatus })
})
app.use('/auth', authRoutes);

  
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})