export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.timerInterval = null;
    this.duration = 0;
  }

  async start(onDurationChange) {
    this.audioChunks = [];
    this.duration = 0;
    
    // Request microphone permissions
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Initialize MediaRecorder
    this.mediaRecorder = new MediaRecorder(this.stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(200); // Collect data chunks every 200ms
    
    // Start duration tracker
    if (onDurationChange) {
      onDurationChange(this.duration);
      this.timerInterval = setInterval(() => {
        this.duration++;
        onDurationChange(this.duration);
      }, 1000);
    }
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Clean up audio tracks (stops mic recording indicators)
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        
        clearInterval(this.timerInterval);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = () => {
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
      };
      this.mediaRecorder.stop();
    }
    clearInterval(this.timerInterval);
    this.audioChunks = [];
  }
}
