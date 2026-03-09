#!/usr/bin/env python3
"""
Enterprise Professional Diagram Generator for Manual Summary Feature
Single Professional Version - Precise Alignment and Big Tech Quality
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    packages = ['matplotlib', 'pillow', 'numpy']
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")

def create_diagrams_directory():
    """Create diagrams directory if it doesn't exist"""
    if not os.path.exists('docs/diagrams'):
        os.makedirs('docs/diagrams')
        print("✅ Created docs/diagrams directory")

#!/usr/bin/env python3
"""
Enterprise Professional Diagram Generator for Manual Summary Feature
Single Ultra-Professional Version - Perfect Alignment and Big Tech Quality
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    packages = ['matplotlib', 'pillow', 'numpy']
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")

def create_diagrams_directory():
    """Create diagrams directory if it doesn't exist"""
    if not os.path.exists('docs/diagrams'):
        os.makedirs('docs/diagrams')
        print("✅ Created docs/diagrams directory")

def create_class_diagram():
    """Create ultra-professional class diagram with perfect alignment"""
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Rectangle
    import numpy as np

    # Massive canvas for perfect spacing
    fig, ax = plt.subplots(1, 1, figsize=(32, 20))
    ax.set_xlim(0, 32)
    ax.set_ylim(0, 20)
    ax.axis('off')

    # Big Tech professional title
    ax.text(16, 19, 'Manual Summary - Class Diagram', fontsize=36, fontweight='bold', ha='center', color='#1a1a1a')

    # Google Material Design 3 colors - professional palette
    colors = {
        'controller': '#0b57d0',  # Google Blue 800
        'view': '#0f9d58',        # Google Green 700
        'service': '#c5221f',     # Google Red 700
        'repository': '#e8710a',  # Google Orange 700
        'model': '#5e35b1',       # Google Purple 700
        'background': '#ffffff'
    }

    # Clean professional background sections
    ax.add_patch(Rectangle((2, 1.5), 14, 16, facecolor='#e8f4fd', edgecolor='#0b57d0', linewidth=4, alpha=0.15))
    ax.add_patch(Rectangle((16.5, 1.5), 13, 8, facecolor='#e6f7e6', edgecolor='#0f9d58', linewidth=4, alpha=0.15))
    ax.add_patch(Rectangle((16.5, 10.5), 13, 7, facecolor='#fce8e6', edgecolor='#c5221f', linewidth=4, alpha=0.15))

    # Professional section labels
    ax.text(9, 17, 'Frontend Components', ha='center', fontsize=20, fontweight='bold', color='#0b57d0')
    ax.text(23, 17, 'Backend Services', ha='center', fontsize=20, fontweight='bold', color='#c5221f')
    ax.text(23, 9.3, 'Data Models', ha='center', fontsize=20, fontweight='bold', color='#5e35b1')

    # Ultra-professional class boxes with perfect alignment
    def create_class_box(x, y, width, height, class_name, attributes, methods, color_key):
        # Use simple Rectangle instead of FancyBboxPatch to eliminate padding/styling issues
        box = plt.Rectangle((x, y), width, height, facecolor='white', edgecolor=colors[color_key], linewidth=3)
        ax.add_patch(box)

        # Professional header with color
        header_height = 1.4
        header = plt.Rectangle((x, y + height - header_height), width, header_height,
                          facecolor=colors[color_key], edgecolor='none')
        ax.add_patch(header)

        ax.text(x + width/2, y + height - header_height/2, class_name,
                ha='center', va='center', fontweight='bold', fontsize=16, color='white')

        # Attributes with precise spacing
        attr_y = y + height - header_height - 0.8
        if attributes:
            ax.text(x + 0.3, attr_y, 'Attributes:', fontweight='bold', fontsize=11, color='#202124')
            attr_y -= 0.7
            for attr in attributes:
                ax.text(x + 0.3, attr_y, f'• {attr}', fontsize=10, color='#3c4043')
                attr_y -= 0.45

        # Methods with precise spacing
        method_y = y + 0.9
        if methods:
            ax.text(x + 0.3, method_y, 'Methods:', fontweight='bold', fontsize=11, color='#202124')
            method_y -= 0.7
            for method in methods:
                ax.text(x + 0.3, method_y, f'• {method}', fontsize=10, color='#3c4043')
                method_y -= 0.45

    # Perfectly positioned components with massive spacing
    create_class_box(3, 12, 7, 5.2, 'ChatChannelView',
        ['channelIdentifier: String',
         'messages: List<MessageViewModel>',
         'isSummaryVisible: Boolean'],
        ['render()', 'displaySummary()', 'hideSummary()', 'updateMessages()'],
        'view')

    create_class_box(11, 12, 7, 5.2, 'ManualSummaryButtonView',
        ['channelIdentifier: String',
         'isEnabled: Boolean'],
        ['render()', 'onClick()', 'setEnabled()'],
        'view')

    create_class_box(7, 5, 7, 5.2, 'ChatChannelController',
        ['chatChannelView: ChatChannelView',
         'summaryButtonView: ManualSummaryButtonView',
         'messageRepository: MessageRepository',
         'summaryService: SummaryService'],
        ['onManualSummaryRequested()', 'fetchMessagesSinceLastRead()',
         'updateLastReadMessage()', 'handleSummaryResponse()'],
        'controller')

    # Perfectly positioned backend services
    create_class_box(17.5, 12, 7, 5.2, 'MessageRepository',
        ['databaseConnection: DatabaseConnection'],
        ['fetchMessagesAfter()', 'fetchMessagesWithinTimeWindow()',
         'getLastReadMessageIdentifier()', 'setLastReadMessageIdentifier()'],
        'repository')

    create_class_box(25.5, 12, 7, 5.2, 'SummaryService',
        ['summarizationProvider: SummarizationProvider'],
        ['generateSummary()', 'transformToViewModel()'],
        'service')

    # Perfectly positioned data models
    create_class_box(17.5, 4, 7, 4.5, 'MessageViewModel',
        ['messageIdentifier: String',
         'senderDisplayName: String',
         'messageContent: String'],
        ['MessageViewModel()'],
        'model')

    create_class_box(25.5, 4, 7, 4.5, 'SummaryViewModel',
        ['summaryText: String',
         'messageCountIncluded: Integer'],
        ['SummaryViewModel()'],
        'model')

    create_class_box(21.5, 8, 7, 4, 'SummaryResult',
        ['summaryText: String',
         'messageCount: Integer'],
        ['SummaryResult()'],
        'model')

    # Ultra-professional relationship arrows with perfect alignment
    def draw_arrow(x1, y1, x2, y2, label='', style='->', color='#3c4043'):
        # Calculate exact box edge connection points
        # Box dimensions: x,y is bottom-left, width=7, height varies
        
        # Source box center
        source_center_x = x1 + 3.5  # width/2 = 7/2 = 3.5
        source_center_y = y1 + 2.8  # approximate height/2 for state boxes
        
        # Target box center  
        target_center_x = x2 + 3.5
        target_center_y = y2 + 2.8
        
        # Determine connection sides based on relative positions
        if abs(source_center_x - target_center_x) > abs(source_center_y - target_center_y):
            # Horizontal relationship
            if source_center_x < target_center_x:
                # Source on left, connect to right edge
                start_x = x1 + 7  # right edge of source box
                start_y = source_center_y
                # Target on right, connect to left edge
                end_x = x2  # left edge of target box
                end_y = target_center_y
            else:
                # Source on right, connect to left edge
                start_x = x1  # left edge of source box
                start_y = source_center_y
                # Target on left, connect to right edge
                end_x = x2 + 7  # right edge of target box
                end_y = target_center_y
        else:
            # Vertical relationship
            if source_center_y < target_center_y:
                # Source below, connect to top edge
                start_x = source_center_x
                start_y = y1 + 5.6  # approximate top edge (height varies)
                # Target above, connect to bottom edge
                end_x = target_center_x
                end_y = y2  # bottom edge of target box
            else:
                # Source above, connect to bottom edge
                start_x = source_center_x
                start_y = y1  # bottom edge of source box
                # Target below, connect to top edge
                end_x = target_center_x
                end_y = y2 + 5.6  # approximate top edge
                
        # Draw arrow with precise edge connections
        ax.annotate('', xy=(end_x, end_y), xytext=(start_x, start_y),
                    arrowprops=dict(arrowstyle=style, lw=6, color=color,
                                  connectionstyle="arc3,rad=0.08"))

        if label:
            mid_x, mid_y = (start_x + end_x) / 2, (start_y + end_y) / 2
            # Position label based on exact arrow direction
            if abs(end_x - start_x) > abs(end_y - start_y):
                # Horizontal arrow
                label_x = mid_x
                label_y = mid_y + 0.8 if end_y > start_y else mid_y - 0.8
            else:
                # Vertical arrow
                label_x = mid_x + 0.8 if end_x > start_x else mid_x - 0.8
                label_y = mid_y
                
            # Professional enterprise label
            ax.text(label_x, label_y, label, ha='center', va='center', fontsize=13,
                    bbox=dict(boxstyle="round,pad=0.5", facecolor='white',
                               edgecolor=color, linewidth=2.5, alpha=0.95))

    # Calculate exact box edge positions and draw arrows to connect precisely
    # Box positions: (x, y, width, height)
    # ChatChannelView: (3, 12, 6, 5.2) -> left: 3, right: 9, top: 17.2, bottom: 12, center_y: 14.6
    # ManualSummaryButtonView: (11, 12, 6, 5.2) -> left: 11, right: 17, top: 17.2, bottom: 12, center_y: 14.6
    # ChatChannelController: (7, 5, 6, 5.2) -> left: 7, right: 13, top: 10.2, bottom: 5, center_y: 7.6
    # MessageRepository: (17.5, 12, 6, 5.2) -> left: 17.5, right: 23.5, top: 17.2, bottom: 12, center_y: 14.6
    # SummaryService: (25.5, 12, 6, 5.2) -> left: 25.5, right: 31.5, top: 17.2, bottom: 12, center_y: 14.6
    # SummaryResult: (21.5, 8, 6, 4) -> left: 21.5, right: 27.5, top: 12, bottom: 8, center_y: 10

    # Use box center points for most reliable arrow connections
    # This avoids padding/styling issues with FancyBboxPatch

    # Box centers: (x + width/2, y + height/2)
    # ChatChannelView center: (3+6/2, 12+5.2/2) = (6, 14.6)
    # ManualSummaryButtonView center: (11+6/2, 12+5.2/2) = (14, 14.6)
    # ChatChannelController center: (7+6/2, 5+5.2/2) = (10, 7.6)
    # MessageRepository center: (17.5+6/2, 12+5.2/2) = (20.5, 14.6)
    # SummaryService center: (25.5+6/2, 12+5.2/2) = (28.5, 14.6)
    # SummaryResult center: (21.5+6/2, 8+4/2) = (24.5, 10)

    # Direct center-to-center arrow connections (most reliable)
    draw_arrow(6, 14.6, 10, 7.6, 'uses', '->', '#0b57d0')          # ChatChannelView to ChatChannelController
    draw_arrow(14, 14.6, 10, 7.6, 'triggers', '->', '#0f9d58')    # ManualSummaryButtonView to ChatChannelController
    draw_arrow(10, 7.6, 20.5, 14.6, 'uses', '->', '#c5221f')      # ChatChannelController to MessageRepository
    draw_arrow(20.5, 14.6, 28.5, 14.6, 'uses', '->', '#e8710a')   # MessageRepository to SummaryService
    draw_arrow(28.5, 14.6, 24.5, 10, 'creates', '->', '#c5221f')  # SummaryService to SummaryResult
    draw_arrow(24.5, 10, 24.5, 6, 'transforms', '->', '#5e35b1')  # SummaryResult to SummaryViewModel

    plt.tight_layout()
    plt.savefig('docs/diagrams/class_diagram.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created ultra-professional class_diagram.png")

def create_state_diagram():
    """Create ultra-professional state diagram with perfect alignment"""
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
    import numpy as np

    fig, ax = plt.subplots(1, 1, figsize=(28, 18))
    ax.set_xlim(0, 28)
    ax.set_ylim(0, 18)
    ax.axis('off')

    # Big Tech professional title
    ax.text(14, 17, 'Manual Summary - State Machine Diagram', fontsize=32, fontweight='bold', ha='center', color='#1a1a1a')

    # Google Material Design 3 colors
    colors = {
        'initial': '#0b57d0',    # Blue 800
        'loading': '#e8710a',    # Orange 700
        'generating': '#0f9d58',  # Green 700
        'visible': '#c5221f',     # Red 700
        'dismissed': '#5e35b1',   # Purple 700
        'nomessages': '#fbbc04'   # Yellow 700
    }

    # Ultra-professional state boxes with perfect alignment
    def create_state(x, y, width, height, name, description, color_key):
        # Professional shadow
        shadow = FancyBboxPatch((x + 0.12, y - 0.12), width, height,
                               boxstyle="round,pad=0.06", facecolor='#dadce0',
                               edgecolor='none', alpha=0.2)
        ax.add_patch(shadow)

        # Clean professional box
        box = FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.06",
                               facecolor='white', edgecolor=colors[color_key], linewidth=5)
        ax.add_patch(box)

        # Professional header
        header_height = 1.4
        header = Rectangle((x, y + height - header_height), width, header_height,
                          facecolor=colors[color_key], edgecolor='none')
        ax.add_patch(header)

        ax.text(x + width/2, y + height - header_height/2, name,
                ha='center', va='center', fontweight='bold', fontsize=16, color='white')

        # Perfectly formatted state description
        lines = description.split('\n')
        desc_y = y + height - header_height - 0.7
        for line in lines:
            ax.text(x + 0.3, desc_y, line, fontsize=10, color='#3c4043')
            desc_y -= 0.4

    # Perfectly positioned states with massive spacing
    create_state(2, 10, 4.5, 3.2, 'IDLE STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: null\nisSummaryLoading: false\nlastReadId: persistedValue',
               'initial')

    create_state(8, 10, 4.5, 3.2, 'LOADING STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: null\nisSummaryLoading: true\nlastReadId: persistedValue',
               'loading')

    create_state(14, 10, 4.5, 3.2, 'GENERATING STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: null\nisSummaryLoading: true\npendingMessages: retrieved',
               'generating')

    create_state(20, 10, 4.5, 3.2, 'VISIBLE STATE',
               'messageList: populated\nsummaryVisible: true\nsummaryContent: populated\nisSummaryLoading: false\nlastReadId: updatedToLatest',
               'visible')

    create_state(8, 5, 4.5, 3.2, 'DISMISSED STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: retained\nisSummaryLoading: false',
               'dismissed')

    create_state(14, 5, 4.5, 3.2, 'NO NEW MESSAGES',
               'messageList: populated\nsummaryVisible: true\nsummaryContent: noNewActivity\nisSummaryLoading: false\nlastReadId: unchanged',
               'nomessages')

    # Professional initial state indicator
    circle = Circle((2, 11.8), 0.35, facecolor=colors['initial'], edgecolor='black', linewidth=4)
    ax.add_patch(circle)
    ax.text(2, 11.8, 'I', ha='center', va='center', fontweight='bold',
            fontsize=16, color='white')

    # Ultra-professional transitions with perfect alignment
    def create_transition(x1, y1, x2, y2, label, event='', guard=''):
        # Perfect arrow positioning
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', lw=6, color='#3c4043',
                                  connectionstyle="arc3,rad=0.1"))

        # Ultra-precise label positioning
        if label:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            if abs(x2 - x1) > abs(y2 - y1):
                if x2 > x1:
                    label_x = mid_x + 1.2
                    label_y = mid_y + 0.8
                else:
                    label_x = mid_x - 1.2
                    label_y = mid_y + 0.8
            else:
                if y2 > y1:
                    label_y = mid_y + 1.2
                    label_x = mid_x + 0.8
                else:
                    label_y = mid_y - 1.2
                    label_x = mid_x + 0.8

            ax.text(label_x, label_y, label, ha='center', va='center', fontsize=11,
                    bbox=dict(boxstyle="round,pad=0.4", facecolor='white',
                               edgecolor='#3c4043', linewidth=2.5, alpha=0.95))

        # Professional event/guard positioning
        if event:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y - 0.8, f'/{event}/', ha='center', fontsize=10,
                    style='italic', color='#0b57d0')
        if guard:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y - 1.2, f'[{guard}]', ha='center', fontsize=10,
                    style='italic', color='#c5221f')

    # Perfectly aligned transitions with direct coordinates
    create_transition(2.225, 11.8, 4.25, 11.8, '', 'onSummaryRequested()')
    create_transition(10.25, 11.8, 12.25, 11.8, '', 'fetchMessagesAfter()', 'retrievedMessages.size > 0')
    create_transition(16.25, 11.8, 18.25, 11.8, '', 'generateSummary()')
    create_transition(10.25, 10, 10.25, 8.2, '', 'onSummaryDismissed()')
    create_transition(10.75, 8.2, 10.75, 5, '', 'resetSummaryState()')
    create_transition(16.25, 10, 16.25, 8.2, '', 'onSummaryDismissed()')
    create_transition(15, 10, 15.25, 8.2, '', 'fetchMessagesAfter()', 'retrievedMessages.size == 0')

    plt.tight_layout()
    plt.savefig('docs/diagrams/state_diagram.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created ultra-professional state_diagram.png")

def create_architecture_diagram():
    """Create ultra-professional architecture diagram with perfect alignment"""
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Rectangle
    import numpy as np

    fig, ax = plt.subplots(1, 1, figsize=(30, 20))
    ax.set_xlim(0, 30)
    ax.set_ylim(0, 20)
    ax.axis('off')

    # Big Tech professional title
    ax.text(15, 19, 'Manual Summary - Architecture Diagram', fontsize=34, fontweight='bold', ha='center', color='#1a1a1a')

    # Google Material Design 3 colors
    colors = {
        'frontend': '#0b57d0',     # Blue 800
        'backend': '#0f9d58',      # Green 700
        'database': '#c5221f',     # Red 700
        'external': '#e8710a',     # Orange 700
        'api': '#5e35b1'           # Purple 700
    }

    # Professional deployment zones with massive spacing
    ax.add_patch(Rectangle((2, 2.5), 9, 15, facecolor='#e3f2fd', edgecolor='#0b57d0', linewidth=5, alpha=0.15))
    ax.add_patch(Rectangle((11.5, 2.5), 9, 15, facecolor='#e8f5e8', edgecolor='#0f9d58', linewidth=5, alpha=0.15))
    ax.add_patch(Rectangle(21, 2.5, 8, 15, facecolor='#ffebee', edgecolor='#c5221f', linewidth=5, alpha=0.15))

    # Professional zone labels
    ax.text(6.5, 17, 'Client Side', ha='center', fontsize=20, fontweight='bold', color='#0b57d0')
    ax.text(16, 17, 'Server Side', ha='center', fontsize=20, fontweight='bold', color='#0f9d58')
    ax.text(25, 17, 'External', ha='center', fontsize=20, fontweight='bold', color='#c5221f')

    # Ultra-professional component boxes with perfect alignment
    def create_component_box(x, y, width, height, name, description, color_key):
        # Professional shadow
        shadow = FancyBboxPatch((x + 0.15, y - 0.15), width, height,
                               boxstyle="round,pad=0.06", facecolor='#dadce0',
                               edgecolor='none', alpha=0.2)
        ax.add_patch(shadow)

        # Clean professional box
        box = FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.06",
                               facecolor='white', edgecolor=colors[color_key], linewidth=5)
        ax.add_patch(box)

        # Professional header
        header_height = 1.4
        header = Rectangle((x, y + height - header_height), width, header_height,
                          facecolor=colors[color_key], edgecolor='none')
        ax.add_patch(header)

        ax.text(x + width/2, y + height - header_height/2, name,
                ha='center', va='center', fontweight='bold', fontsize=16, color='white')

        # Perfectly formatted description
        if description:
            lines = description.split('\n')
            desc_y = y + height - header_height - 0.7
            for line in lines:
                ax.text(x + 0.25, desc_y, line, fontsize=10, color='#3c4043')
                desc_y -= 0.45

    # Perfectly positioned components with massive spacing
    create_component_box(3, 10, 6.5, 4, 'Frontend (React)',
                        '• ChatChannelView\n• ManualSummaryButtonView\n• ChatChannelController\n• User Interface Components',
                        'frontend')

    create_component_box(12.5, 10, 6.5, 4, 'Backend Services (Node.js)',
                        '• MessageRepository\n• SummaryService\n• API Endpoints\n• Business Logic',
                        'backend')

    create_component_box(22, 10, 6, 4, 'Database (PostgreSQL)',
                        '• Messages Table\n• Users Table\n• Read State Table\n• Summary Cache',
                        'database')

    create_component_box(12.5, 6, 6.5, 3.5, 'API Layer (REST/GraphQL)',
                        '• Request/Response\n• Authentication\n• Rate Limiting\n• Error Handling',
                        'api')

    create_component_box(22, 6, 6, 3.5, 'External Services',
                        '• LLM API (OpenAI)\n• Authentication Service\n• File Storage',
                        'external')

    # Ultra-professional connection arrows with perfect alignment
    def draw_arrow(x1, y1, x2, y2, label='', style='->', color='#3c4043'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle=style, lw=6, color=color,
                                  connectionstyle="arc3,rad=0.1"))

        if label:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y + 0.6, label, ha='center', fontsize=13,
                    bbox=dict(boxstyle="round,pad=0.6", facecolor='white',
                               edgecolor=color, linewidth=2.5, alpha=0.95))

    # Perfectly aligned connections
    draw_arrow(9.25, 11.5, 12.5, 11.5, 'HTTP/REST', '->', '#0b57d0')
    draw_arrow(19, 11.5, 22, 11.5, 'SQL Queries', '->', '#0f9d58')
    draw_arrow(19, 11, 22, 7.5, 'API Calls', '->', '#c5221f')
    draw_arrow(6.25, 10, 12.5, 7.5, 'Client Requests', '->', '#0b57d0')
    draw_arrow(12.5, 9, 15, 10, 'Internal Calls', '->', '#5e35b1')

    plt.tight_layout()
    plt.savefig('docs/diagrams/architecture_diagram.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created ultra-professional architecture_diagram.png")

def create_flow_chart():
    """Create ultra-professional flow chart with perfect alignment"""
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Circle, Polygon, Rectangle
    import numpy as np

    fig, ax = plt.subplots(1, 1, figsize=(24, 18))
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 18)
    ax.axis('off')

    # Big Tech professional title
    ax.text(12, 17, 'Manual Summary - Flow Chart', fontsize=30, fontweight='bold', ha='center', color='#1a1a1a')

    # Google Material Design 3 colors
    colors = {
        'start_end': '#0b57d0',  # Blue 800
        'process': '#0f9d58',    # Green 700
        'decision': '#e8710a',   # Orange 700
        'data': '#c5221f',       # Red 700
        'subprocess': '#5e35b1'  # Purple 700
    }

    # Professional swim lanes with massive spacing
    ax.add_patch(Rectangle((2, 2.5), 7, 13, facecolor='#e3f2fd', edgecolor='#0b57d0', linewidth=4, alpha=0.15))
    ax.add_patch(Rectangle((9.5, 2.5), 7.5, 13, facecolor='#e8f5e8', edgecolor='#0f9d58', linewidth=4, alpha=0.2))
    ax.add_patch(Rectangle((17.5, 2.5), 6, 13, facecolor='#fff3e0', edgecolor='#e8710a', linewidth=4, alpha=0.2))

    # Professional swim lane labels
    ax.text(5.5, 15, 'User Actions', ha='center', fontsize=18, fontweight='bold', color='#0b57d0')
    ax.text(13.25, 15, 'System Processing', ha='center', fontsize=18, fontweight='bold', color='#0f9d58')
    ax.text(20.5, 15, 'Display Output', ha='center', fontsize=18, fontweight='bold', color='#c5221f')

    # Ultra-professional flow elements with perfect alignment
    def create_ellipse(x, y, width, height, text, color_key):
        shadow = patches.Ellipse((x + 0.03, y - 0.03), width, height,
                                facecolor='#dadce0', edgecolor='none', alpha=0.2)
        ax.add_patch(shadow)

        ellipse = patches.Ellipse((x, y), width, height,
                                facecolor=colors[color_key], edgecolor='black', linewidth=5)
        ax.add_patch(ellipse)
        ax.text(x, y, text, ha='center', va='center', fontsize=16, fontweight='bold', color='white')

    def create_rectangle(x, y, width, height, text, color_key):
        shadow = FancyBboxPatch((x - width/2 + 0.03, y - height/2 - 0.03), width, height,
                               boxstyle="round,pad=0.08", facecolor='#dadce0',
                               edgecolor='none', alpha=0.2)
        ax.add_patch(shadow)

        box = FancyBboxPatch((x - width/2, y - height/2), width, height,
                               boxstyle="round,pad=0.08", facecolor=colors[color_key],
                               edgecolor='black', linewidth=5)
        ax.add_patch(box)
        ax.text(x, y, text, ha='center', va='center', fontsize=13, fontweight='bold', color='white')

    def create_diamond(x, y, width, height, text, color_key):
        shadow = Polygon([[x + 0.03, y + height/2], [x + width/2 + 0.03, y],
                         [x + 0.03, y - height/2], [x - width/2 + 0.03, y]],
                        facecolor='#dadce0', edgecolor='none', alpha=0.2)
        ax.add_patch(shadow)

        diamond = Polygon([[x, y + height/2], [x + width/2, y],
                         [x, y - height/2], [x - width/2, y]],
                        facecolor=colors[color_key], edgecolor='black', linewidth=5)
        ax.add_patch(diamond)
        ax.text(x, y, text, ha='center', va='center', fontsize=13, fontweight='bold', color='white')

    # Perfectly positioned flow elements
    create_ellipse(5.5, 13.5, 1.8, 0.9, 'START', 'start_end')

    create_rectangle(5.5, 11.5, 4, 1.6, 'User clicks\n"Manual Summary"', 'process')

    create_rectangle(13.25, 11.5, 4.5, 1.6, 'Enter LOADING STATE', 'process')

    create_rectangle(13.25, 9.5, 4.5, 1.6, 'Fetch messages\nfrom database', 'data')

    create_diamond(13.25, 7.5, 2.2, 1.3, 'Messages\nfound?', 'decision')

    create_rectangle(8, 5.5, 3.5, 1.6, 'Generate summary', 'process')

    create_rectangle(18.5, 5.5, 3.5, 1.6, 'Show "No new\nmessages"', 'process')

    create_rectangle(20.5, 9.5, 3.5, 1.6, 'Display summary\nto user', 'process')

    create_ellipse(20.5, 7.5, 1.8, 0.9, 'END', 'start_end')

    # Ultra-professional arrows with perfect alignment
    def create_arrow(x1, y1, x2, y2, label='', style='->'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle=style, lw=6, color='#3c4043',
                                  connectionstyle="arc3,rad=0.1"))
        if label:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y + 0.6, label, ha='center', fontsize=12,
                    bbox=dict(boxstyle="round,pad=0.5", facecolor='white',
                               edgecolor='#3c4043', linewidth=2.5, alpha=0.95))

    # Perfectly aligned flow arrows with direct coordinates
    create_arrow(5.5, 13.2, 5.5, 12.3)  # Start to User clicks
    create_arrow(5.5, 11.9, 5.5, 11.1)  # User clicks to Enter LOADING
    create_arrow(5.5, 10.9, 5.5, 10.1)  # Enter LOADING to Fetch messages
    create_arrow(5.5, 9, 5.5, 8.1)      # Fetch messages to Messages found?
    create_arrow(12.15, 7, 8, 6.1, 'Yes')     # Messages found to Generate summary
    create_arrow(14.35, 7, 18.5, 6.1, 'No')   # Messages found to Show no messages
    create_arrow(8, 5, 20.5, 8.9)             # Generate summary to Display summary
    create_arrow(18.5, 5, 20.5, 7.9)          # Show no messages to Display summary  
    create_arrow(20.5, 8.9, 20.5, 7.9)        # Display summary to END

    plt.tight_layout()
    plt.savefig('docs/diagrams/flow_chart.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created ultra-professional flow_chart.png")

def main():
    """Main function to generate all ultra-professional diagrams"""
    print("🎨 Starting Ultra-Professional Big Tech Diagram Generation")
    print("=" * 75)

    # Create directory
    create_diagrams_directory()

    # Install requirements
    print("\n📦 Installing required packages...")
    install_requirements()

    # Generate ultra-professional diagrams
    print("\n🖼️  Generating ultra-professional diagrams with perfect alignment...")
    try:
        create_class_diagram()
        create_state_diagram()
        create_flow_chart()
        create_architecture_diagram()

        print("\n✅ All ultra-professional diagrams generated successfully!")
        print("📁 Diagrams saved to: docs/diagrams/")
        print("\n📋 Generated files:")
        print("   • class_diagram.png (Ultra-Professional Big Tech Quality)")
        print("   • state_diagram.png (Ultra-Professional Big Tech Quality)")
        print("   • flow_chart.png (Ultra-Professional Big Tech Quality)")
        print("   • architecture_diagram.png (Ultra-Professional Big Tech Quality)")
        print("\n🎯 Key Improvements:")
        print("   • Massive canvas sizes (28x18 to 32x20) for perfect spacing")
        print("   • Precise mathematical alignment calculations")
        print("   • Google Material Design 3 color palette")
        print("   • Professional 3D shadow effects")
        print("   • Enterprise typography and spacing")
        print("   • Thick borders (5px) for crisp professional lines")

        print("\n🔗 To use in your dev spec, add this markdown:")
        print("![Class Diagram](diagrams/class_diagram.png)")
        print("![State Diagram](diagrams/state_diagram.png)")
        print("![Flow Chart](diagrams/flow_chart.png)")
        print("![Architecture Diagram](diagrams/architecture_diagram.png)")

    except Exception as e:
        print(f"❌ Error generating diagrams: {e}")
        print("\n💡 Try installing packages manually:")
        print("pip install matplotlib pillow numpy")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())

def create_state_diagram():
    """Create ultra-professional state diagram with precise alignment"""
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
    import numpy as np
    
    fig, ax = plt.subplots(1, 1, figsize=(24, 16))
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 16)
    ax.axis('off')
    
    # Big Tech professional title
    ax.text(12, 15, 'Manual Summary - State Machine Diagram', fontsize=28, fontweight='bold', ha='center', color='#202124')
    
    # Google enterprise color palette
    colors = {
        'initial': '#1a73e8',    # Blue 700
        'loading': '#fbbc04',    # Yellow 700
        'generating': '#34a853',  # Green 700
        'visible': '#ea4335',     # Red 700
        'dismissed': '#7b1fa2',   # Purple 700
        'nomessages': '#ff7043'   # Orange 700
    }
    
    # Ultra-professional state boxes with precise alignment
    def create_state(x, y, width, height, name, description, color_key):
        # Enterprise shadow with precise positioning
        shadow = FancyBboxPatch((x + 0.1, y - 0.1), width, height,
                               boxstyle="round,pad=0.05", facecolor='#e8eaed',
                               edgecolor='none', alpha=0.25)
        ax.add_patch(shadow)
        
        # Professional main box with precise alignment
        box = FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.05",
                               facecolor='white', edgecolor=colors[color_key], linewidth=4)
        ax.add_patch(box)
        
        # Professional header with better sizing
        header_height = 1.2
        header = Rectangle((x, y + height - header_height), width, header_height,
                          facecolor=colors[color_key], edgecolor='none')
        ax.add_patch(header)
        
        ax.text(x + width/2, y + height - header_height/2, name,
                ha='center', va='center', fontweight='bold', fontsize=14, color='white')
        
        # Perfectly formatted state description
        lines = description.split('\n')
        desc_y = y + height - header_height - 0.6
        for line in lines:
            ax.text(x + 0.25, desc_y, line, fontsize=9, color='#495057')
            desc_y -= 0.35
    
    # Perfectly positioned states with optimal spacing
    create_state(1.5, 9, 4, 2.8, 'IDLE STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: null\nisSummaryLoading: false\nlastReadId: persistedValue',
               'initial')
    
    create_state(7, 9, 4, 2.8, 'LOADING STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: null\nisSummaryLoading: true\nlastReadId: persistedValue',
               'loading')
    
    create_state(12.5, 9, 4, 2.8, 'GENERATING STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: null\nisSummaryLoading: true\npendingMessages: retrieved',
               'generating')
    
    create_state(18, 9, 4, 2.8, 'VISIBLE STATE',
               'messageList: populated\nsummaryVisible: true\nsummaryContent: populated\nisSummaryLoading: false\nlastReadId: updatedToLatest',
               'visible')
    
    create_state(7, 4.5, 4, 2.8, 'DISMISSED STATE',
               'messageList: populated\nsummaryVisible: false\nsummaryContent: retained\nisSummaryLoading: false',
               'dismissed')
    
    create_state(12.5, 4.5, 4, 2.8, 'NO NEW MESSAGES',
               'messageList: populated\nsummaryVisible: true\nsummaryContent: noNewActivity\nisSummaryLoading: false\nlastReadId: unchanged',
               'nomessages')
    
    # Professional initial state indicator with precise positioning
    circle = Circle((1.5, 10.9), 0.3, facecolor=colors['initial'], edgecolor='black', linewidth=3)
    ax.add_patch(circle)
    ax.text(1.5, 10.9, 'I', ha='center', va='center', fontweight='bold',
            fontsize=14, color='white')
    
    # Ultra-professional transitions with precise alignment
    def create_transition(x1, y1, x2, y2, label, event='', guard=''):
        # Perfect arrow positioning with calculated curves
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', lw=5, color='#3c4043',
                                  connectionstyle="arc3,rad=0.08"))
        
        # Professional label positioning with precise calculations
        if label:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            if abs(x2 - x1) > abs(y2 - y1):  # Horizontal arrow
                if x2 > x1:
                    label_x = mid_x + 1.0
                    label_y = mid_y + 0.6
                else:
                    label_x = mid_x - 1.0
                    label_y = mid_y + 0.6
            else:  # Vertical arrow
                if y2 > y1:
                    label_y = mid_y + 1.0
                    label_x = mid_x + 0.6
                else:
                    label_y = mid_y - 1.0
                    label_x = mid_x + 0.6
            
            ax.text(label_x, label_y, label, ha='center', va='center', fontsize=10,
                    bbox=dict(boxstyle="round,pad=0.3", facecolor='white',
                               edgecolor='#3c4043', linewidth=2, alpha=0.95))
        
        # Professional event/guard positioning
        if event:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y - 0.6, f'/{event}/', ha='center', fontsize=9,
                    style='italic', color='#1a73e8')
        if guard:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y - 0.9, f'[{guard}]', ha='center', fontsize=9,
                    style='italic', color='#ea4335')
    
    # Perfectly aligned transitions
    create_transition(1.9, 10.9, 3.5, 10.9, '', 'onSummaryRequested()')
    create_transition(9, 10.9, 11, 10.9, '', 'fetchMessagesAfter()', 'retrievedMessages.size > 0')
    create_transition(14.5, 10.9, 16.5, 10.9, '', 'generateSummary()')
    create_transition(9, 9, 9, 7.3, '', 'onSummaryDismissed()')
    create_transition(9.5, 7.3, 9.5, 4.5, '', 'resetSummaryState()')
    create_transition(14.5, 9, 14.5, 7.3, '', 'onSummaryDismissed()')
    create_transition(13, 9, 13.5, 7.3, '', 'fetchMessagesAfter()', 'retrievedMessages.size == 0')
    
    plt.tight_layout()
    plt.savefig('docs/diagrams/state_diagram.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created enterprise-quality state_diagram.png")

def create_architecture_diagram():
    """Create ultra-professional architecture diagram with precise alignment"""
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Rectangle
    import numpy as np
    
    fig, ax = plt.subplots(1, 1, figsize=(26, 18))
    ax.set_xlim(0, 26)
    ax.set_ylim(0, 18)
    ax.axis('off')
    
    # Big Tech professional title
    ax.text(13, 17, 'Manual Summary - Architecture Diagram', fontsize=30, fontweight='bold', ha='center', color='#202124')
    
    # Google enterprise color palette
    colors = {
        'frontend': '#1a73e8',     # Blue 700
        'backend': '#34a853',      # Green 700
        'database': '#ea4335',     # Red 700
        'external': '#fbbc04',     # Yellow 700
        'api': '#7b1fa2'           # Purple 700
    }
    
    # Professional deployment zones with precise alignment
    ax.add_patch(Rectangle((1.5, 2), 8, 14, facecolor='#e3f2fd', edgecolor='#1a73e8', linewidth=4, alpha=0.2))
    ax.add_patch(Rectangle((10, 2), 8, 14, facecolor='#e8f5e8', edgecolor='#34a853', linewidth=4, alpha=0.2))
    ax.add_patch(Rectangle(17.5, 2, 7, 14, facecolor='#ffebee', edgecolor='#ea4335', linewidth=4, alpha=0.2))
    
    # Professional zone labels with precise positioning
    ax.text(5.5, 15.5, 'Client Side', ha='center', fontsize=18, fontweight='bold', color='#1a73e8')
    ax.text(14, 15.5, 'Server Side', ha='center', fontsize=18, fontweight='bold', color='#34a853')
    ax.text(21, 15.5, 'External', ha='center', fontsize=18, fontweight='bold', color='#ea4335')
    
    # Ultra-professional component boxes with precise alignment
    def create_component_box(x, y, width, height, name, description, color_key):
        # Enterprise shadow with precise positioning
        shadow = FancyBboxPatch((x + 0.1, y - 0.1), width, height,
                               boxstyle="round,pad=0.05", facecolor='#e8eaed',
                               edgecolor='none', alpha=0.25)
        ax.add_patch(shadow)
        
        # Professional main box with precise alignment
        box = FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.05",
                               facecolor='white', edgecolor=colors[color_key], linewidth=4)
        ax.add_patch(box)
        
        # Professional header with better sizing
        header_height = 1.2
        header = Rectangle((x, y + height - header_height), width, header_height,
                          facecolor=colors[color_key], edgecolor='none')
        ax.add_patch(header)
        
        ax.text(x + width/2, y + height - header_height/2, name,
                ha='center', va='center', fontweight='bold', fontsize=14, color='white')
        
        # Perfectly formatted description with precise spacing
        if description:
            lines = description.split('\n')
            desc_y = y + height - header_height - 0.6
            for line in lines:
                ax.text(x + 0.2, desc_y, line, fontsize=9, color='#495057')
                desc_y -= 0.4
    
    # Perfectly positioned components with optimal spacing
    create_component_box(2.5, 9, 6, 3.5, 'Frontend (React)',
                        '• ChatChannelView\n• ManualSummaryButtonView\n• ChatChannelController\n• User Interface Components',
                        'frontend')
    
    create_component_box(11, 9, 6, 3.5, 'Backend Services (Node.js)',
                        '• MessageRepository\n• SummaryService\n• API Endpoints\n• Business Logic',
                        'backend')
    
    create_component_box(18.5, 9, 5.5, 3.5, 'Database (PostgreSQL)',
                        '• Messages Table\n• Users Table\n• Read State Table\n• Summary Cache',
                        'database')
    
    create_component_box(11, 5, 6, 3, 'API Layer (REST/GraphQL)',
                        '• Request/Response\n• Authentication\n• Rate Limiting\n• Error Handling',
                        'api')
    
    create_component_box(18.5, 5, 5.5, 3.5, 'External Services',
                        '• LLM API (OpenAI)\n• Authentication Service\n• File Storage',
                        'external')
    
    # Ultra-professional connection arrows with precise alignment
    def draw_arrow(x1, y1, x2, y2, label='', style='->', color='#3c4043'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle=style, lw=5, color=color,
                                  connectionstyle="arc3,rad=0.08"))
        
        if label:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y + 0.5, label, ha='center', fontsize=12,
                    bbox=dict(boxstyle="round,pad=0.5", facecolor='white',
                               edgecolor=color, linewidth=2, alpha=0.95))
    
    # Perfectly aligned connections with precise positioning
    draw_arrow(8.5, 10.5, 11, 10.5, 'HTTP/REST', '->', '#1a73e8')
    draw_arrow(17, 10.5, 18.5, 10.5, 'SQL Queries', '->', '#34a853')
    draw_arrow(17, 10, 18.5, 6.5, 'API Calls', '->', '#ea4335')
    draw_arrow(5.5, 9, 11, 6.5, 'Client Requests', '->', '#1a73e8')
    draw_arrow(11, 8, 13.5, 9, 'Internal Calls', '->', '#7b1fa2')
    
    plt.tight_layout()
    plt.savefig('docs/diagrams/architecture_diagram.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created enterprise-quality architecture_diagram.png")

def create_flow_chart():
    """Create ultra-professional flow chart with precise alignment"""
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.patches import FancyBboxPatch, Circle, Polygon, Rectangle
    import numpy as np
    
    fig, ax = plt.subplots(1, 1, figsize=(20, 16))
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 16)
    ax.axis('off')
    
    # Big Tech professional title
    ax.text(10, 15, 'Manual Summary - Flow Chart', fontsize=26, fontweight='bold', ha='center', color='#202124')
    
    # Google enterprise color palette
    colors = {
        'start_end': '#1a73e8',  # Blue 700
        'process': '#34a853',    # Green 700
        'decision': '#fbbc04',   # Yellow 700
        'data': '#ea4335',       # Red 700
        'subprocess': '#7b1fa2'  # Purple 700
    }
    
    # Professional swim lanes with precise alignment
    ax.add_patch(Rectangle((1.5, 2), 6, 12, facecolor='#e3f2fd', edgecolor='#1a73e8', linewidth=3, alpha=0.2))
    ax.add_patch(Rectangle((8, 2), 6, 12, facecolor='#e8f5e8', edgecolor='#34a853', linewidth=3, alpha=0.2))
    ax.add_patch(Rectangle((14, 2), 5, 12, facecolor='#fff3e0', edgecolor='#fbbc04', linewidth=3, alpha=0.2))
    
    # Professional swim lane labels with precise positioning
    ax.text(4.5, 13.5, 'User Actions', ha='center', fontsize=16, fontweight='bold', color='#1a73e8')
    ax.text(11, 13.5, 'System Processing', ha='center', fontsize=16, fontweight='bold', color='#34a853')
    ax.text(16.5, 13.5, 'Display Output', ha='center', fontsize=16, fontweight='bold', color='#d32f2f')
    
    # Ultra-professional flow elements with precise alignment
    def create_ellipse(x, y, width, height, text, color_key):
        shadow = patches.Ellipse((x + 0.03, y - 0.03), width, height,
                                facecolor='#e8eaed', edgecolor='none', alpha=0.25)
        ax.add_patch(shadow)
        
        ellipse = patches.Ellipse((x, y), width, height,
                                facecolor=colors[color_key], edgecolor='black', linewidth=4)
        ax.add_patch(ellipse)
        ax.text(x, y, text, ha='center', va='center', fontsize=14, fontweight='bold', color='white')
    
    def create_rectangle(x, y, width, height, text, color_key):
        shadow = FancyBboxPatch((x - width/2 + 0.03, y - height/2 - 0.03), width, height,
                               boxstyle="round,pad=0.08", facecolor='#e8eaed',
                               edgecolor='none', alpha=0.25)
        ax.add_patch(shadow)
        
        box = FancyBboxPatch((x - width/2, y - height/2), width, height,
                               boxstyle="round,pad=0.08", facecolor=colors[color_key],
                               edgecolor='black', linewidth=4)
        ax.add_patch(box)
        ax.text(x, y, text, ha='center', va='center', fontsize=12, fontweight='bold', color='white')
    
    def create_diamond(x, y, width, height, text, color_key):
        shadow = Polygon([[x + 0.03, y + height/2], [x + width/2 + 0.03, y],
                         [x + 0.03, y - height/2], [x - width/2 + 0.03, y]],
                        facecolor='#e8eaed', edgecolor='none', alpha=0.25)
        ax.add_patch(shadow)
        
        diamond = Polygon([[x, y + height/2], [x + width/2, y],
                         [x, y - height/2], [x - width/2, y]],
                        facecolor=colors[color_key], edgecolor='black', linewidth=4)
        ax.add_patch(diamond)
        ax.text(x, y, text, ha='center', va='center', fontsize=12, fontweight='bold', color='white')
    
    # Perfectly positioned flow elements with optimal spacing
    create_ellipse(4.5, 12.5, 1.6, 0.8, 'START', 'start_end')
    
    create_rectangle(4.5, 10.5, 3.5, 1.4, 'User clicks\n"Manual Summary"', 'process')
    
    create_rectangle(11, 10.5, 4, 1.4, 'Enter LOADING STATE', 'process')
    
    create_rectangle(11, 8.5, 4, 1.4, 'Fetch messages\nfrom database', 'data')
    
    create_diamond(11, 6.5, 2, 1.2, 'Messages\nfound?', 'decision')
    
    create_rectangle(7, 4.5, 3, 1.4, 'Generate summary', 'process')
    
    create_rectangle(15, 4.5, 3, 1.4, 'Show "No new\nmessages"', 'process')
    
    create_rectangle(17, 8.5, 3, 1.4, 'Display summary\nto user', 'process')
    
    create_ellipse(17, 6.5, 1.6, 0.8, 'END', 'start_end')
    
    # Ultra-professional arrows with precise alignment
    def create_arrow(x1, y1, x2, y2, label='', style='->'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle=style, lw=5, color='#3c4043',
                                  connectionstyle="arc3,rad=0.08"))
        if label:
            mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mid_x, mid_y + 0.5, label, ha='center', fontsize=11,
                    bbox=dict(boxstyle="round,pad=0.4", facecolor='white',
                               edgecolor='#3c4043', linewidth=2, alpha=0.95))
    
    # Perfectly aligned flow arrows
    create_arrow(4.5, 12.2, 4.5, 11.2)
    create_arrow(6, 10.5, 11, 10.5)
    create_arrow(11, 9.8, 11, 9.2)
    create_arrow(11, 8, 11, 7.1)
    create_arrow(10, 6, 7, 5.1, 'Yes')
    create_arrow(12, 6, 15, 5.1, 'No')
    create_arrow(7, 4, 17, 7.9)
    create_arrow(15, 4, 17, 6.8)
    create_arrow(17, 7.9, 17, 6.8)
    
    plt.tight_layout()
    plt.savefig('docs/diagrams/flow_chart.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Created enterprise-quality flow_chart.png")

def main():
    """Main function to generate all ultra-professional diagrams"""
    print("🎨 Starting Ultra-Professional Big Tech Diagram Generation")
    print("=" * 70)
    
    # Create directory
    create_diagrams_directory()
    
    # Install requirements
    print("\n📦 Installing required packages...")
    install_requirements()
    
    # Generate ultra-professional diagrams with precise alignment
    print("\n🖼️  Generating ultra-professional diagrams with precise alignment...")
    try:
        create_class_diagram()
        create_state_diagram()
        create_flow_chart()
        create_architecture_diagram()
        
        print("\n✅ All ultra-professional diagrams generated successfully!")
        print("📁 Diagrams saved to: docs/diagrams/")
        print("\n📋 Generated files:")
        print("   • class_diagram.png (Big Tech Quality)")
        print("   • state_diagram.png (Big Tech Quality)") 
        print("   • flow_chart.png (Big Tech Quality)")
        print("   • architecture_diagram.png (Big Tech Quality)")
        print("\nFeatures:")
        print("   • Precise arrow and text alignment with box edges")
        print("   • Google/Microsoft enterprise color schemes")
        print("   • Professional spacing and typography")
        print("   • 3D shadow effects and clean layouts")
        
        print("\n🔗 To use in your dev spec, add this markdown:")
        print("![Class Diagram](diagrams/class_diagram.png)")
        print("![State Diagram](diagrams/state_diagram.png)")
        print("![Flow Chart](diagrams/flow_chart.png)")
        print("![Architecture Diagram](diagrams/architecture_diagram.png)")
        
    except Exception as e:
        print(f"❌ Error generating diagrams: {e}")
        print("\n💡 Try installing packages manually:")
        print("pip install matplotlib pillow numpy")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())

if __name__ == "__main__":
    exit(main())
