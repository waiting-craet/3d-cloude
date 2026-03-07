# Homepage Redesign Testing Guide

## Overview

This guide provides an overview of the testing documentation for the homepage redesign project. The redesign transforms the current homepage into a minimalist, elegant interface inspired by traditional Chinese ink-wash painting (水墨风格) with a light color palette.

## Testing Documentation

This testing suite includes comprehensive documentation for ensuring the homepage redesign works correctly across all target browsers and viewport sizes.

### 1. Cross-Browser Testing

**Document**: `CROSS-BROWSER-TESTING.md`

**Purpose**: Ensure the homepage renders correctly and functions properly across all target browsers.

**Target Browsers**:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 13+)
- Chrome Mobile (Android 8+)

**Key Areas Tested**:
- Visual rendering (colors, typography, layout)
- Navigation bar (fixed positioning, backdrop blur)
- Hero section (gradient background, search input)
- Statistics display (number formatting)
- Gallery section (grid layout)
- Work cards (hover effects, click navigation)
- Scrolling behavior
- Interactive elements
- Performance
- Browser-specific features and fallbacks

### 2. Responsive Testing

**Document**: `RESPONSIVE-TESTING.md`

**Purpose**: Ensure the homepage adapts correctly to different viewport sizes and maintains usability across all devices.

**Test Viewport Sizes**:
- **320px** - Small mobile (iPhone SE)
- **768px** - Tablet portrait (iPad)
- **1024px** - Small desktop / Tablet landscape
- **1440px** - Large desktop

**Key Areas Tested**:
- Layout adaptation at each viewport size
- Grid column changes (2 → 4 → 6 columns)
- Typography scaling
- Image responsiveness
- Touch target sizing (mobile/tablet)
- Orientation changes (portrait/landscape)
- Zoom behavior (up to 200%)
- Horizontal scrolling verification
- Performance across viewports

## Testing Workflow

### Phase 1: Desktop Browser Testing

1. **Chrome/Edge Testing**
   - Open `CROSS-BROWSER-TESTING.md`
   - Follow Chrome/Edge checklist
   - Document version numbers and test date
   - Check all items in the checklist
   - Note any issues found

2. **Firefox Testing**
   - Follow Firefox checklist
   - Pay special attention to backdrop-filter fallback
   - Document any Firefox-specific issues

3. **Safari Testing**
   - Follow Safari checklist
   - Verify backdrop-filter works (Safari has good support)
   - Test on actual macOS device if possible

### Phase 2: Mobile Browser Testing

4. **Mobile Safari Testing (iOS)**
   - Test on actual iOS device (iPhone)
   - Follow Mobile Safari checklist
   - Test touch interactions
   - Verify safe area insets (notch devices)
   - Test orientation changes

5. **Chrome Mobile Testing (Android)**
   - Test on actual Android device
   - Follow Chrome Mobile checklist
   - Test touch interactions
   - Verify address bar behavior

### Phase 3: Responsive Testing

6. **320px Viewport Testing**
   - Open `RESPONSIVE-TESTING.md`
   - Set browser to 320px width
   - Follow 320px checklist
   - Verify no horizontal scrolling
   - Check touch target sizes

7. **768px Viewport Testing**
   - Set browser to 768px width
   - Follow 768px checklist
   - Verify grid changes to 4 columns
   - Check breakpoint transition

8. **1024px Viewport Testing**
   - Set browser to 1024px width
   - Follow 1024px checklist
   - Verify layout utilizes space effectively

9. **1440px Viewport Testing**
   - Set browser to 1440px width
   - Follow 1440px checklist
   - Verify grid changes to 6 columns
   - Check max-width constraints

### Phase 4: Special Cases

10. **Horizontal Scrolling Verification**
    - Test at each viewport size
    - Ensure no horizontal scrollbar appears
    - Check all elements fit within viewport width

11. **Orientation Testing**
    - Test portrait and landscape on mobile/tablet
    - Verify smooth transitions
    - Check content accessibility in both orientations

12. **Zoom Testing**
    - Test at 100% and 200% zoom
    - Verify layout doesn't break
    - Check text remains readable

## Testing Tools

### Browser DevTools
- **Chrome DevTools**: Device emulation, network throttling
- **Firefox Developer Tools**: Responsive design mode
- **Safari Web Inspector**: iOS device debugging

### Cross-Browser Testing Services
- **BrowserStack**: Test on real devices and browsers
- **LambdaTest**: Live interactive testing
- **Sauce Labs**: Automated testing

### Automated Testing
- **Playwright**: Cross-browser automation
- **Cypress**: End-to-end testing
- **Selenium**: Multi-browser testing

## Common Issues and Quick Fixes

### Backdrop Blur Not Working
**Issue**: Navigation bar backdrop blur doesn't work in some browsers.

**Fix**: Add fallback solid background:
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(10px);

@supports not (backdrop-filter: blur(10px)) {
  background: rgba(255, 255, 255, 1);
}
```

### Horizontal Scrolling on Mobile
**Issue**: Horizontal scrollbar appears on narrow viewports.

**Fix**: Ensure all elements use box-sizing and max-width:
```css
* {
  box-sizing: border-box;
}

img {
  max-width: 100%;
  height: auto;
}
```

### Grid Columns Not Changing
**Issue**: Grid doesn't change from 2 to 4 to 6 columns at breakpoints.

**Fix**: Verify media queries are correct:
```css
.grid {
  grid-template-columns: repeat(2, 1fr); /* Mobile */
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(4, 1fr); /* Tablet */
  }
}

@media (min-width: 1200px) {
  .grid {
    grid-template-columns: repeat(6, 1fr); /* Desktop */
  }
}
```

### Touch Targets Too Small
**Issue**: Buttons are too small to tap on mobile.

**Fix**: Ensure minimum 44x44px touch targets:
```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}
```

### Fixed Navigation Overlaps Content
**Issue**: Fixed navigation bar overlaps page content.

**Fix**: Add padding-top to body:
```css
body {
  padding-top: 64px; /* Height of navbar */
}
```

## Browser-Specific Fallbacks

### Backdrop Filter
- **Chrome/Edge**: Supported ✓
- **Firefox**: Check version (may need fallback)
- **Safari**: Supported ✓
- **Mobile Safari**: Supported ✓
- **Chrome Mobile**: Supported ✓

**Fallback**: Solid background color

### CSS Grid
- **All target browsers**: Supported ✓

**Fallback**: Flexbox layout (if supporting older browsers)

### CSS Custom Properties
- **All target browsers**: Supported ✓

**Fallback**: Inline values or Sass variables

## Sign-Off Checklist

### Cross-Browser Testing
- [ ] Chrome/Edge testing completed
- [ ] Firefox testing completed
- [ ] Safari testing completed
- [ ] Mobile Safari testing completed
- [ ] Chrome Mobile testing completed
- [ ] All browser-specific issues resolved
- [ ] Fallbacks verified and working

### Responsive Testing
- [ ] 320px viewport testing completed
- [ ] 768px viewport testing completed
- [ ] 1024px viewport testing completed
- [ ] 1440px viewport testing completed
- [ ] No horizontal scrolling at any viewport
- [ ] Grid columns adjust correctly at breakpoints
- [ ] Touch targets meet minimum size requirements
- [ ] Orientation changes work correctly
- [ ] Zoom testing completed (up to 200%)

### Overall Quality
- [ ] All visual elements render correctly
- [ ] All functionality works across browsers
- [ ] All interactive elements are accessible
- [ ] Performance is acceptable across all devices
- [ ] No console errors or warnings
- [ ] Accessibility requirements met (WCAG AA)
- [ ] Ready for production deployment

## Testing Timeline

**Estimated Time**: 4-6 hours

- Cross-browser testing: 2-3 hours
- Responsive testing: 1-2 hours
- Issue resolution: 1 hour
- Final verification: 30 minutes

## Reporting Issues

When reporting issues found during testing, include:

1. **Browser/Device**: Which browser and version
2. **Viewport Size**: Width in pixels
3. **Issue Description**: What's wrong
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshot**: Visual evidence of the issue
7. **Steps to Reproduce**: How to recreate the issue
8. **Severity**: Critical / High / Medium / Low

## Resources

### Documentation
- `CROSS-BROWSER-TESTING.md` - Detailed cross-browser testing checklist
- `RESPONSIVE-TESTING.md` - Detailed responsive testing checklist
- `requirements.md` - Project requirements
- `design.md` - Design specifications
- `tasks.md` - Implementation tasks

### Design Specifications
- **Color Palette**: Ink-wash style with light, muted tones
- **Typography**: Clean sans-serif with system font fallbacks
- **Spacing**: Consistent spacing system (4px to 120px)
- **Breakpoints**: 768px (tablet), 1200px (desktop)
- **Grid Columns**: 2 (mobile), 4 (tablet), 6 (desktop)

### Support
- For questions about testing procedures, refer to this guide
- For questions about design specifications, refer to `design.md`
- For questions about requirements, refer to `requirements.md`

---

**Last Updated**: [Date]

**Version**: 1.0

**Status**: Ready for Testing
