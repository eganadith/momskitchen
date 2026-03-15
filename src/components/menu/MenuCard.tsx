"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MenuItemResponse } from "@/types";

interface MenuCardProps {
  item: MenuItemResponse;
}

export function MenuCard({ item }: MenuCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md border border-border rounded-2xl bg-card">
      {item.image ? (
        <div className="relative h-40 w-full bg-muted">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
      ) : (
        <div className="h-24 w-full bg-muted flex items-center justify-center">
          <span className="text-4xl text-muted-foreground">🍛</span>
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="mt-2 text-sm text-foreground">
          <span className="text-muted-foreground">Normal:</span> LKR {item.priceNormal}
          {" · "}
          <span className="text-muted-foreground">Full:</span> LKR {item.priceFull}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-0">
        <Link href={`/menu/${item.id}`} className="w-full">
          <Button className="w-full rounded-full font-medium bg-primary hover:bg-primary/90" size="lg">
            Add to cart
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
