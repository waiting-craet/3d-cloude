import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuItem from '../MenuItem';

/**
 * Property 1: 导航项选中状态唯一性
 * 对于任何导航栏状态，最多只有一个菜单项处于选中状态。
 * 验证: Requirements 4
 */
describe('MenuItem - Property 1: Selection State Uniqueness', () => {
  it('should maintain only one selected item at a time', () => {
    const mockOnClick1 = jest.fn();
    const mockOnClick2 = jest.fn();

    const { rerender, container } = render(
      <>
        <MenuItem
          id="item-1"
          label="Item 1"
          isSelected={true}
          onClick={mockOnClick1}
        />
        <MenuItem
          id="item-2"
          label="Item 2"
          isSelected={false}
          onClick={mockOnClick2}
        />
      </>
    );

    // Initially, only item-1 should be selected
    let menuItems = container.querySelectorAll('[role="button"]');
    expect(menuItems[0].className).toContain('selected');
    expect(menuItems[1].className).not.toContain('selected');

    // Simulate switching selection to item-2
    rerender(
      <>
        <MenuItem
          id="item-1"
          label="Item 1"
          isSelected={false}
          onClick={mockOnClick1}
        />
        <MenuItem
          id="item-2"
          label="Item 2"
          isSelected={true}
          onClick={mockOnClick2}
        />
      </>
    );

    // Now only item-2 should be selected
    menuItems = container.querySelectorAll('[role="button"]');
    expect(menuItems[0].className).not.toContain('selected');
    expect(menuItems[1].className).toContain('selected');
  });

  it('should never have multiple items selected simultaneously', () => {
    const mockOnClick = jest.fn();

    const { container } = render(
      <>
        <MenuItem
          id="item-1"
          label="Item 1"
          isSelected={true}
          onClick={mockOnClick}
        />
        <MenuItem
          id="item-2"
          label="Item 2"
          isSelected={false}
          onClick={mockOnClick}
        />
        <MenuItem
          id="item-3"
          label="Item 3"
          isSelected={false}
          onClick={mockOnClick}
        />
      </>
    );

    // Count selected items by checking className
    const menuItems = container.querySelectorAll('[role="button"]');
    let selectedCount = 0;
    menuItems.forEach((item) => {
      if (item.className.includes('selected')) {
        selectedCount++;
      }
    });
    
    expect(selectedCount).toBeLessThanOrEqual(1);
  });

  it('should apply selected class only to the selected item', () => {
    const mockOnClick = jest.fn();

    const { container } = render(
      <>
        <MenuItem
          id="my-projects"
          label="我的项目"
          isSelected={true}
          onClick={mockOnClick}
        />
        <MenuItem
          id="new-project"
          label="新建图谱"
          isSelected={false}
          onClick={mockOnClick}
        />
      </>
    );

    const menuItems = container.querySelectorAll('[role="button"]');
    expect(menuItems[0].className).toContain('selected');
    expect(menuItems[1].className).not.toContain('selected');
  });
});
