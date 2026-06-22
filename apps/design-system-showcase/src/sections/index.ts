import type { ComponentType } from 'react';
import HomeSection from './HomeSection';
import ButtonSection from './ButtonSection';
import BadgeSection from './BadgeSection';
import InputSection from './InputSection';
import AvatarSection from './AvatarSection';
import CheckboxSection from './CheckboxSection';
import LabelSection from './LabelSection';
import TextareaSection from './TextareaSection';
import SwitchSection from './SwitchSection';
import RadioGroupSection from './RadioGroupSection';
import SliderSection from './SliderSection';
import ToggleSection from './ToggleSection';
import ToggleGroupSection from './ToggleGroupSection';
import SeparatorSection from './SeparatorSection';
import AspectRatioSection from './AspectRatioSection';
import CollapsibleSection from './CollapsibleSection';
import ScrollAreaSection from './ScrollAreaSection';
import SkeletonSection from './SkeletonSection';
import PopoverSection from './PopoverSection';
import TooltipSection from './TooltipSection';
import DropdownMenuSection from './DropdownMenuSection';
import SelectSection from './SelectSection';
import HoverCardSection from './HoverCardSection';
import SheetSection from './SheetSection';
import AlertDialogSection from './AlertDialogSection';
import TabsSection from './TabsSection';
import BreadcrumbSection from './BreadcrumbSection';
import PaginationSection from './PaginationSection';
import AccordionSection from './AccordionSection';
import NavItemSection from './NavItemSection';
import CardSection from './CardSection';
import MessageSection from './MessageSection';
import AlertSection from './AlertSection';
import ToastSection from './ToastSection';
import ModalSection from './ModalSection';

import CalendarSection from './CalendarSection';
import TableSection from './TableSection';
import ProgressSection from './ProgressSection';
import InputOTPSection from './InputOTPSection';
import CarouselSection from './CarouselSection';
import ComboboxSection from './ComboboxSection';
import CommandSection from './CommandSection';
import SidebarSection from './SidebarSection';
import ResizableSection from './ResizableSection';
import MenubarSection from './MenubarSection';

export interface SectionDef {
  id: string;
  label: string;
  category: 'atom' | 'molecule' | 'organism' | 'overview';
  component: ComponentType;
}

export const sections: SectionDef[] = [
  // Overview
  { id: 'overview', label: 'Overview', category: 'overview', component: HomeSection },
  // Atoms
  { id: 'button',   label: 'Button',   category: 'atom',     component: ButtonSection   },
  { id: 'badge',    label: 'Badge',    category: 'atom',     component: BadgeSection    },
  { id: 'input',    label: 'Input',    category: 'atom',     component: InputSection    },
  { id: 'avatar',   label: 'Avatar',   category: 'atom',     component: AvatarSection   },
  { id: 'checkbox', label: 'Checkbox', category: 'atom',     component: CheckboxSection },
  { id: 'label',    label: 'Label',    category: 'atom',     component: LabelSection    },
  { id: 'textarea', label: 'Textarea', category: 'atom',     component: TextareaSection },
  { id: 'switch',   label: 'Switch',   category: 'atom',     component: SwitchSection   },
  { id: 'radiogroup', label: 'Radio Group', category: 'atom', component: RadioGroupSection },
  { id: 'slider',   label: 'Slider',   category: 'atom',     component: SliderSection   },
  { id: 'toggle',   label: 'Toggle',   category: 'atom',     component: ToggleSection   },
  { id: 'togglegroup', label: 'Toggle Group', category: 'atom', component: ToggleGroupSection },
  { id: 'separator', label: 'Separator', category: 'atom',     component: SeparatorSection },
  { id: 'aspectratio', label: 'Aspect Ratio', category: 'atom', component: AspectRatioSection },
  { id: 'skeleton', label: 'Skeleton', category: 'atom',     component: SkeletonSection },
  { id: 'navitem',  label: 'NavItem',  category: 'atom',     component: NavItemSection  },
  { id: 'progress', label: 'Progress',  category: 'atom',     component: ProgressSection },
  // Molecules
  { id: 'card',     label: 'Card',     category: 'molecule', component: CardSection     },
  { id: 'message',  label: 'Message',  category: 'molecule', component: MessageSection  },
  { id: 'alert',    label: 'Alert',    category: 'molecule', component: AlertSection    },
  { id: 'toast',    label: 'Toast',    category: 'molecule', component: ToastSection    },
  { id: 'collapsible', label: 'Collapsible', category: 'molecule', component: CollapsibleSection },
  { id: 'scrollarea', label: 'Scroll Area', category: 'molecule', component: ScrollAreaSection },
  { id: 'popover',  label: 'Popover',  category: 'molecule', component: PopoverSection  },
  { id: 'tooltip',  label: 'Tooltip',  category: 'molecule', component: TooltipSection  },
  { id: 'dropdownmenu', label: 'Dropdown Menu', category: 'molecule', component: DropdownMenuSection },
  { id: 'select',   label: 'Select',   category: 'molecule', component: SelectSection   },
  { id: 'hovercard', label: 'Hover Card', category: 'molecule', component: HoverCardSection },
  { id: 'tabs',     label: 'Tabs',     category: 'molecule', component: TabsSection     },
  { id: 'breadcrumb', label: 'Breadcrumb', category: 'molecule', component: BreadcrumbSection },
  { id: 'pagination', label: 'Pagination', category: 'molecule', component: PaginationSection },
  { id: 'accordion', label: 'Accordion', category: 'molecule', component: AccordionSection },
  { id: 'calendar',  label: 'Calendar',  category: 'molecule', component: CalendarSection  },
  { id: 'table',     label: 'Table',     category: 'molecule', component: TableSection     },
  { id: 'inputotp',  label: 'Input OTP', category: 'molecule', component: InputOTPSection  },
  { id: 'combobox',  label: 'Combobox',  category: 'molecule', component: ComboboxSection  },
  // Organisms
  { id: 'modal',    label: 'Modal',    category: 'organism', component: ModalSection    },
  { id: 'sheet',    label: 'Sheet',    category: 'organism', component: SheetSection    },
  { id: 'alertdialog', label: 'Alert Dialog', category: 'organism', component: AlertDialogSection },
  { id: 'carousel',  label: 'Carousel',  category: 'organism', component: CarouselSection  },
  { id: 'command',   label: 'Command',   category: 'organism', component: CommandSection   },
  { id: 'sidebar',   label: 'Sidebar',   category: 'organism', component: SidebarSection   },
  { id: 'resizable', label: 'Resizable', category: 'organism', component: ResizableSection },
  { id: 'menubar',   label: 'Menubar',   category: 'organism', component: MenubarSection   },
];
