#!/usr/bin/env python3
"""
Debug Version - Visual markers to identify arrow alignment issues
"""

import subprocess
import sys
import os

def install_requirements():
    packages = ['matplotlib', 'pillow', 'numpy']
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")

def create_diagrams_directory():
    if not os.path.exists('docs/diagrams'):
        os.makedirs('docs/diagrams')
        print("✅ Created docs/diagrams directory")

def create_debug_class_diagram():
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
    import numpy as np

    fig, ax = plt.subplots(1, 1, figsize=(20, 14))
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 14)
    ax.axis('off')

    ax.text(10, 13.5, 'DEBUG: Class Diagram - Arrow Alignment Test', fontsize=18, fontweight='bold', ha='center', color='#1a1a1a')

    colors = {
        'controller': '#1a73e8',
        'view': '#34a853',
        'service': '#ea4335',
        'repository': '#fbbc04',
        'model': '#7b1fa2',
        'background': '#ffffff'
    }

    # Create simple test boxes
    def create_test_box(x, y, width, height, label):
        box = plt.Rectangle((x, y), width, height, facecolor='lightblue', edgecolor='blue', linewidth=2, alpha=0.5)
        ax.add_patch(box)
        ax.text(x + width/2, y + height/2, label, ha='center', va='center', fontsize=12, fontweight='bold')

        # Add markers at key connection points
        # Left edge center
        left_marker = Circle((x, y + height/2), 0.1, facecolor='red', edgecolor='red')
        ax.add_patch(left_marker)
        ax.text(x - 0.3, y + height/2, 'L', fontsize=8, color='red', ha='center', va='center')

        # Right edge center
        right_marker = Circle((x + width, y + height/2), 0.1, facecolor='green', edgecolor='green')
        ax.add_patch(right_marker)
        ax.text(x + width + 0.3, y + height/2, 'R', fontsize=8, color='green', ha='center', va='center')

        # Top edge center
        top_marker = Circle((x + width/2, y + height), 0.1, facecolor='blue', edgecolor='blue')
        ax.add_patch(top_marker)
        ax.text(x + width/2, y + height + 0.3, 'T', fontsize=8, color='blue', ha='center', va='center')

        # Bottom edge center
        bottom_marker = Circle((x + width/2, y), 0.1, facecolor='orange', edgecolor='orange')
        ax.add_patch(bottom_marker)
        ax.text(x + width/2, y - 0.3, 'B', fontsize=8, color='orange', ha='center', va='center')

        # Center point
        center_marker = Circle((x + width/2, y + height/2), 0.15, facecolor='purple', edgecolor='purple')
        ax.add_patch(center_marker)
        ax.text(x + width/2, y + height/2, 'C', fontsize=8, color='white', ha='center', va='center', fontweight='bold')

        return x, y, width, height

    # Create test boxes with known positions
    box1_x, box1_y, box1_w, box1_h = create_test_box(2, 8, 4, 3, 'Box 1')
    box2_x, box2_y, box2_w, box2_h = create_test_box(10, 8, 4, 3, 'Box 2')
    box3_x, box3_y, box3_w, box3_h = create_test_box(6, 3, 4, 3, 'Box 3')

    # Test different arrow positioning methods
    def test_arrow(x1, y1, x2, y2, label, method_name, color):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', lw=3, color=color))

        # Label the arrow with method name
        mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mid_x, mid_y + 0.5, f'{method_name}\n{label}', ha='center', va='center',
                fontsize=9, bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.9))

    # Test 1: Direct center to center
    center1_x, center1_y = box1_x + box1_w/2, box1_y + box1_h/2
    center3_x, center3_y = box3_x + box3_w/2, box3_y + box3_h/2
    test_arrow(center1_x, center1_y, center3_x, center3_y, 'center→center', 'CENTER', 'red')

    # Test 2: Right edge to left edge
    right1_x, right1_y = box1_x + box1_w, box1_y + box1_h/2
    left3_x, left3_y = box3_x, box3_y + box3_h/2
    test_arrow(right1_x, right1_y, left3_x, left3_y, 'right→left', 'EDGES', 'green')

    # Test 3: Bottom edge to top edge
    bottom1_x, bottom1_y = box1_x + box1_w/2, box1_y
    top3_x, top3_y = box3_x + box3_w/2, box3_y + box3_h
    test_arrow(bottom1_x, bottom1_y, top3_x, top3_y, 'bottom→top', 'VERTICAL', 'blue')

    # Test 4: Box 2 to Box 3
    center2_x, center2_y = box2_x + box2_w/2, box2_y + box2_h/2
    test_arrow(center2_x, center2_y, center3_x, center3_y, 'box2→box3', 'CROSS', 'purple')

    # Add legend
    ax.text(1, 1, 'LEGEND:\nRed L/R: Left/Right edge centers\nGreen T/B: Top/Bottom edge centers\nPurple C: Box center\nArrows show different connection methods',
            fontsize=8, verticalalignment='bottom',
            bbox=dict(boxstyle="round,pad=0.5", facecolor='lightyellow'))

    plt.tight_layout()
    plt.savefig('docs/diagrams/debug_class_diagram.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created debug_class_diagram.png with visual markers")

def main():
    print("🔍 Creating debug diagrams to identify alignment issues...")
    create_diagrams_directory()
    install_requirements()
    create_debug_class_diagram()
    print("📊 Check docs/diagrams/debug_class_diagram.png to see exactly where arrows connect vs box markers")

if __name__ == "__main__":
    main()
