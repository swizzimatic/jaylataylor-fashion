# Video Setup Instructions

## Required Video Files

To complete the hero video background setup, you'll need to add the following video files to the `assets/videos/` directory:

### 1. Primary Video File

- **Filename**: `hero-video.mp4`
- **Format**: MP4 (H.264 codec recommended)
- **Recommended specs**:
  - Duration: 10-30 seconds (looping)
  - Resolution: 1920x1080 (Full HD) minimum
  - Aspect ratio: 16:9
  - File size: Under 10MB for optimal loading
  - Frame rate: 30fps

### 2. WebM Fallback (Optional but recommended)

- **Filename**: `hero-video.webm`
- **Format**: WebM (VP9 codec recommended)
- **Same specs as MP4**

## Video Content Recommendations

For Jayla Taylor's fashion brand, consider these video concepts:

1. **Fashion Show Highlights**: Runway footage from NYC or Paris Fashion Week
2. **Behind-the-Scenes**: Photoshoot or design process footage
3. **Product Showcase**: Elegant product reveals or styling shots
4. **Lifestyle Content**: Models wearing JT pieces in sophisticated settings

## Technical Considerations

- **Mobile Optimization**: Ensure video works well on mobile devices
- **Accessibility**: The current setup includes:
  - Play/pause toggle button
  - Reduced motion support
  - Fallback poster image
  - Screen reader friendly controls

## Video Conversion Tools

If you need to convert or optimize your videos:

- **Online**: CloudConvert, Online-Convert
- **Software**: HandBrake (free), Adobe Media Encoder
- **Command Line**: FFmpeg

## Example FFmpeg Commands

```bash
# Convert to optimized MP4
ffmpeg -i input-video.mov -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart hero-video.mp4

# Convert to WebM
ffmpeg -i input-video.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k hero-video.webm
```

## Testing

After adding your video files:

1. Test autoplay functionality across different browsers
2. Verify mobile performance
3. Check that the fallback image displays when video fails to load
4. Test the play/pause toggle button
5. Verify accessibility features work properly

## Fallback Strategy

The current implementation includes multiple fallback options:

1. Primary MP4 video
2. WebM video (better compression)
3. Poster image (your current hero image)
4. Background color (brand primary dark)

This ensures your site works regardless of browser support or network conditions.
