import { IconEdit } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarTrigger,
} from "./ui/sidebar";
import { Button } from "./ui/button";

export const AppSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-5">
        <SidebarTrigger className="size-12 [&_svg]:size-4!" />
        <SidebarMenuButton
          size="lg"
          tooltip="New Analysis Task"
          className="[&_svg]:size-4! group-data-[collapsible=icon]:size-12!  group-data-[collapsible=icon]:shrink-0 group-data-[collapsible=icon]:mx-auto p-0!"
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <IconEdit className="[&_svg]:size-4!" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">New Analysis Task</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Analysis History</SidebarGroupLabel>
          <SidebarGroupContent>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="lg"
                className="overflow-hidden max-w-full"
              >
                <span className="truncate">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laborum, fuga.</span>
              </Button>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};
