const dotenv = require('dotenv');
dotenv.config();
const natural = require('natural');
const path = require("path");
const stringSimilarity = require("string-similarity");
const speech = require('@google-cloud/speech');
const docSimilarity = require('doc-similarity');
const profanityHindi = require('profanity-hindi');
const { Comprehend } = require("@aws-sdk/client-comprehend");
const authRoutes = require('./login');
require('./db');
console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)
const express = require('express')
const multer = require('multer');
var jwt = require('express-jwt');
var cors = require('cors');

const app = express()
const port = 3001

app.use(express.static(path.join(__dirname, "..", "build")));
app.use(express.static("public"));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(cors())

// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "public", "index.html"));
// });

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
            phrases: ["tikona", "Broadband", "तिकोना", "ब्रॉडबैंड"],
            boost: 10.0
        },
        {
            phrases: ["अनलिमिटेड डेटा", "15 एमबीपीएस", "तीन चार गुना"],
            boost: 5.0
        }, {
            // Added for profanity detection
            phrases: ["कुत्ता", "कामिना", "हरामज़्यादा", "इडियट"],
            boost: 5.0
        }]
    };
    request.audio = {
        content: audio
    };
    request.config = config;
    const responses = await client.recognize(request);
    return responses;
}

const getSentimentFlag = async (transcriptionHindi) => {
    try {
        var params = {
            LanguageCode: 'hi',
            Text: transcriptionHindi
        };
        const sentiment = await comprehend.detectSentiment(params);
        console.log(sentiment)
        const { Mixed, Negative, Neutral, Positive } = sentiment.SentimentScore;
        const inference = `The audio has the following component Mixed ${Mixed}, Negative ${Negative}, Neutral, ${Neutral}, Positive, ${Positive}.`;
        if (Negative > 0.5) {
            return { redFlag: 2, greenFlag: 0, inference };
        }
        if(Positive > 0.8) {
            return { redFlag: 0, greenFlag: 0, inference };
        }
        if(Neutral > 0.8) {
            return { redFlag: 0, greenFlag: 1, inference };
        }
        return { redFlag: 0, greenFlag: 0, inference };
    } catch(error) {
        return { redFlag: 0, greenFlag: 0, inference: "Unable to detect sentiment." }
    }
}

const getSimilarityFlag = async (transcriptionHindi) => {
    const doc1 = "हैलो पंकज जी बात कर रहे हैं? जी मैं राहुल बात कर रहा हूं तिकोना ब्रॉडबैंड Teekona Broadband से। हमारी कंपनी बोहोत हाई स्पीड पर अनलिमिटेड डेटा प्रोवाइड कर ती है। हमारा सबसे कम पैक 15 एमबीपीएस का है और वो मोबाइल डेटा की स्पीड से 3-4 गुना तेज है";
    // const similarityConfidence = docSimilarity.wordFrequencySim(doc1, transcriptionHindi, docSimilarity.cosineSim);
    const similarityConfidence = stringSimilarity.compareTwoStrings(doc1, transcriptionHindi);
      
    // console.log(docSimilarity.wordFrequencySim(doc1, transcriptionHindi, docSimilarity.cosineSim))
    // console.log(docSimilarity.wordFrequencySim(doc1, transcriptionHindi, docSimilarity.jaccardSim))
    const inference = `The similarity confidence in the audio is ${similarityConfidence}.`;
    console.log("****************")
    console.log(similarityConfidence)
    console.log("****************")
    if(similarityConfidence >= 0.7) {
        return { redFlag: 0, greenFlag: 3, inference };
    }
    if(similarityConfidence >= 0.5) {
        return { redFlag: 0, greenFlag: 2, inference };
    }
    if(similarityConfidence >= 0.2) {
        return { redFlag: 1, greenFlag: 0, inference }
    }
    return { redFlag: 2, greenFlag: 0, inference };
}

const getProfanityFlag = async (transcriptionHindi) => {
    try {
        const profanityList = ["कुत्ता", "कामिना", "हरामज़्यादा", "इडियट"]
        const transcriptionWords = transcriptionHindi.split(" ");
        console.log(transcriptionWords)
        let redFlag = 0;
        const inAppropriateWordsDetected = [];
        transcriptionWords.map((transcriptionWord) => {
            profanityList.map((badWord) => {
                let confidence = natural.JaroWinklerDistance(transcriptionWord, badWord);
                if(confidence > 0.85) {
                    redFlag = redFlag + 1;
                    console.log(confidence)
                    inAppropriateWordsDetected.push(transcriptionWord);
                }
            })
        })
        if(redFlag > 0) {
            return { redFlag, greenFlag: 0, inference: `In-appropriate words detected. ${inAppropriateWordsDetected}` };
        }
        return { redFlag: 0, greenFlag: 0, inference: `No In-appropriate words detected` };
    } catch(error) {
        console.log(error)
        return { redFlag: 0, greenFlag: 0, inference: "Unable to check profanity." };
    }
}

app.post('/upload', jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256']
  }), uploadStrategy, async (req, res) => {
    console.log(req["file"].buffer);
    const responseHindi = await transcribeAudioHindi(req["file"].buffer);
    // const responseEnglish = await transcribeAudioEnglish(req["file"].buffer);
  
    const transcriptionHindi = responseHindi[0].results.length ? responseHindi[0].results
        .map(result => {
        console.log(result.alternatives)
            return result.alternatives[0].transcript
        })
        .join('\n'): "";
    console.log(transcriptionHindi)
    let redFlagCount = 0, greenFlagCount = 0;
    const sentimentFlags = await getSentimentFlag(transcriptionHindi);
    const similarityFlags = await getSimilarityFlag(transcriptionHindi);
    const profanityFlags = await getProfanityFlag(transcriptionHindi);
    redFlagCount += sentimentFlags.redFlag + similarityFlags.redFlag + profanityFlags.redFlag;
    greenFlagCount += sentimentFlags.greenFlag + similarityFlags.greenFlag + profanityFlags.greenFlag;
    console.log(greenFlagCount)
    console.log(redFlagCount)
    console.log({ sentimentFlags });
    console.log({ similarityFlags });
    console.log({ profanityFlags });
    const inference = sentimentFlags.inference + similarityFlags.inference + profanityFlags.inference;
    let audioStatus = "Flagged";
    if(greenFlagCount > redFlagCount + 1) {
        audioStatus = "Pass";
    } else if(redFlagCount > greenFlagCount + 1) {
        audioStatus = "Fail";
    }
    console.log(audioStatus)
    res.status(200).send({ audioStatus, inference })
})
app.use('/auth', authRoutes);

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})