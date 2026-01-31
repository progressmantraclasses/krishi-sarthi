// utils/speechToText.ts
import { Audio } from 'expo-av';

export class SpeechToTextService {
  private recording: Audio.Recording | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startRecording(): Promise<Audio.Recording | null> {
    try {
      if (!(await this.requestPermissions())) {
        throw new Error('Audio permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      return recording;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return null;
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      
      // Convert audio to text using your preferred service
      // This is a placeholder - integrate with Google Speech-to-Text, Azure, etc.
      return await this.convertAudioToText(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  private async convertAudioToText(audioUri: string | null): Promise<string> {
    if (!audioUri) return '';
    
    // Placeholder for actual speech-to-text implementation
    // You can integrate with services like:
    // - Google Cloud Speech-to-Text
    // - Azure Speech Services
    // - AWS Transcribe
    
    try {
      // Example API call structure:
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any);
      formData.append('language', 'hi-IN'); // or detect language

      const response = await fetch('YOUR_SPEECH_TO_TEXT_API_ENDPOINT', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      return result.transcript || 'Could not convert speech to text';
    } catch (error) {
      console.error('Speech to text conversion failed:', error);
      return 'Voice message recorded (conversion failed)';
    }
  }
}