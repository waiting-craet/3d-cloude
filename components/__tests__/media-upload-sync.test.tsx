import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { InlineVideoUpload } from '@/components/InlineVideoUpload'
import { InlineImageUpload } from '@/components/InlineImageUpload'

describe('Media Upload Components Sync', () => {
  describe('InlineVideoUpload', () => {
    it('should update video source when currentVideoUrl prop changes', () => {
      const { rerender } = render(
        <InlineVideoUpload 
          nodeId="node-1" 
          currentVideoUrl="http://example.com/video1.mp4" 
          onVideoChange={() => {}} 
        />
      )
      
      let sourceEl = document.querySelector('source')
      expect(sourceEl).toHaveAttribute('src', 'http://example.com/video1.mp4')
      
      // Simulate selecting another node (prop changes)
      rerender(
        <InlineVideoUpload 
          nodeId="node-2" 
          currentVideoUrl="http://example.com/video2.mp4" 
          onVideoChange={() => {}} 
        />
      )
      
      sourceEl = document.querySelector('source')
      expect(sourceEl).toHaveAttribute('src', 'http://example.com/video2.mp4')
    })
  })

  describe('InlineImageUpload', () => {
    it('should update image source when currentImageUrl prop changes', () => {
      const { rerender } = render(
        <InlineImageUpload 
          nodeId="node-1" 
          currentImageUrl="http://example.com/image1.jpg" 
          onImageChange={() => {}} 
        />
      )
      
      let imgEl = screen.getByAltText('节点图片')
      expect(imgEl).toHaveAttribute('src', 'http://example.com/image1.jpg')
      
      // Simulate selecting another node (prop changes)
      rerender(
        <InlineImageUpload 
          nodeId="node-2" 
          currentImageUrl="http://example.com/image2.png" 
          onImageChange={() => {}} 
        />
      )
      
      imgEl = screen.getByAltText('节点图片')
      expect(imgEl).toHaveAttribute('src', 'http://example.com/image2.png')
    })
  })
})
