import React from 'react'
import HeroSection from '../HeroSection'

/**
 * Example usage of the HeroSection component
 * 
 * This example demonstrates how to use the HeroSection component
 * with the default title and subtitle from the design document.
 */
export default function HeroSectionExample() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query)
    // Implement search functionality here
  }

  return (
    <div>
      <HeroSection
        title="构建与发现知识的无尽脉络"
        subtitle="在这里，每一个想法都能找到它的位置，每一条知识都能连接成网络"
        onSearch={handleSearch}
      />
    </div>
  )
}
