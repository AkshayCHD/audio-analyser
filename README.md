# Audio Analyser

## Overview
The application acts as an audio analyser, responsible for recording audio via web browser, analyse it using different mechanisms against a provided script, and categorizing it among 3 categories namely
* Pass
* Failed
* Flag

## Steps in analysis
The following measures are used to provide Red/Green flags to audios and based on the difference of red and green flags we determine in which state the audio should be in.

### Conversion from audio to text
The Application uses Google's Speech to Text api, to convert the recorded audio to text. To increase the accuracy of the api we have used Phase boost feature of the api, that boosts the detection of some phases that are most likly to occur given our context of audio, such as proper nouns, that would be hard to detect otherwise.

### Similarity Detection
Once we have the audio converted to text, we use `Dice's Coefficient` which is is a statistic used to gauge the similarity of two samples, to calculate the degree of similarity between the converted string and our string.

### Sentiment Analysis
After similarity analysis we use sentiment analysis to analyse emotions in the sound, for this we use Amazon Comprehend, that can analyse sentiments of text written in hindi languages quite efficiently, and allot red and green flags according to the results obtained.

### Profanity Analysis
Sentiment analysis is not every good at detecting profanity in a text sample, in the sense that it does not take it that seriously if the rest of the input seems good, so for that we have to add another layer of profanity analysis on top of sentiment analysis that uses `JaroWinklerDistance` to detect words that are close to or exactly same as our set of bad words/phrases.

### Categorizing
Finally we take the red and green flags provided by these various methods and on the basis of the total number of flags determine if the audio has passed out test or failed it or has been flagged.

## Project Setup
To set up the project you will need
* Google Speech to Text api access key
* Amazon Comprehend Access keys
* Google OAuth ClientId and Client Secret
* MongoDB connection string

Once you have all of that follow the steps to setup the application

* Clone the application
```
git clone https://github.com/AkshayCHD/audio-analyser.git
```

* Move to project directory
```
cd audio-analyser
```

* Add following environment variables
```
GOOGLE_APPLICATION_CREDENTIALS=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
MONGO_URI=
JWT_SECRET=
BACKEND_URL=
FRONTEND_URL=
REACT_APP_API_URL=
GOOGLE_LOGIN_CLIENT_ID=
GOOGLE_LOGIN_CLIENT_SECRET=
```

* Build the web-app
```
npm run build
```

* Run the express app
```
node ./server/index.js
```