import logo from './logo.svg';
import { RecordRTCPromisesHandler } from 'recordrtc'
import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import SettingsVoiceRoundedIcon from '@material-ui/icons/SettingsVoiceRounded';
import StopRoundedIcon from '@material-ui/icons/StopRounded';
import { makeStyles } from '@material-ui/core/styles';
import Timer from './components/Timer';

const recordingStates = {
  START: "start",
  STOP: "stop",
  NEUTRAL: "neutral"
};

const useStyles = makeStyles((theme) => ({
  recordButton: {
    backgroundColor: "#1976d2",
    "&:hover, &:focus": {
      backgroundColor: "#4791db"
    },
  },
  stopButton:  {
    backgroundColor: "#dc004e",
    "&:hover, &:focus": {
      backgroundColor: "#e33371"
    },
  },
}));


function App() {
  const classes = useStyles();
  const [recording, setRecording] = useState(recordingStates.NEUTRAL);
  const [recorder, setRecorder] = useState(null);
  const initializeRecorder = async () => {
    let stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
    let currentRecorder = new RecordRTCPromisesHandler(stream, {
        type: 'audio',
    });
    setRecorder(currentRecorder);
  }
  useEffect(() => {
    initializeRecorder();
  }, [])
  const startRecording = async () => {
    recorder.startRecording();
  }

  const stopRecording = async () => {
    try {
      setRecording(recordingStates.STOP)
      await recorder.stopRecording();
      let blob = await recorder.getBlob();
      const data = new FormData() 
      data.append('file', blob,  'audio.wav')
      const res = await axios.post("http://localhost:3001/upload", data, { // receive two parameter endpoint url ,form data 
      })
      console.log(res)
    } catch (err) {
      console.error(err)
    } finally {
      setRecording(recordingStates.NEUTRAL);
    }
    
  }

  useEffect(() => {
    if(recording === recordingStates.START) {
      startRecording();
    } else if(recording === recordingStates.STOP) {
      stopRecording();
    }
  }, [recording])

  const getIconButton = () => {
    if(recording === recordingStates.NEUTRAL) {
      return <SettingsVoiceRoundedIcon />;
    } else if(recording === recordingStates.START) {
      return <StopRoundedIcon />;
    } else {
      return <SettingsVoiceRoundedIcon/>
    }
  }
  return (
    <div className="App">
      <IconButton 
        disabled={ recording === recordingStates.STOP ? true : false }
        className={recording === recordingStates.START ? classes.stopButton : classes.recordButton }
        onClick={() => recording === recordingStates.NEUTRAL ?
          setRecording(recordingStates.START) : recording === recordingStates.START ?
          setRecording(recordingStates.STOP) : setRecording(recordingStates.NEUTRAL)
        } aria-label="Record">
        {getIconButton()}
      </IconButton>
      <p>
      हैलो पंकज जी बात कर रहे हैं? जी मैं राहुल बात कर रहा हूं Tikona Broadband से। हमारी कंपनी बोहोत हाई स्पीड पर अनलिमिटेड डेटा प्रोवाइड कर ती है। हमारा सबसे कम पैक 15 एमबीपीएस का है और वो मोबाइल डेटा की स्पीड से 3-4 गुना तेज है
      </p>
      { recording === recordingStates.START ? <Timer /> : null }
    </div>
  );
}

export default App;
