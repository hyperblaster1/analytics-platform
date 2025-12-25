"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/app/components/ui/tabs";
import { Header } from "@/app/components/layout/Header";
import { useIngestionStatus } from "@/app/hooks/useIngestionStatus";
import PnodesClient from "@/app/components/pnodes/PnodesClient";
import NetworkClient from "@/app/components/network/NetworkClient";
import { PnodeListClientProps } from "@/app/types";

export function MainClient(props: PnodeListClientProps) {
  const [activeTab, setActiveTab] = useState<"nodes" | "network">("nodes");
  const [selectedSeedId] = useState<string | "global">(
    props.seeds.length > 0 ? props.seeds[0].baseUrl : "global"
  );
  const { nextApiCallInSeconds } = useIngestionStatus({ selectedSeedId });

  return (
    <>
      <Header
        nextApiCallInSeconds={nextApiCallInSeconds}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "nodes" | "network")}
      >
        <TabsContent value="nodes" className="mt-0">
          <PnodesClient {...props} />
        </TabsContent>
        <TabsContent value="network" className="mt-0">
          <NetworkClient />
        </TabsContent>
      </Tabs>
    </>
  );
}
