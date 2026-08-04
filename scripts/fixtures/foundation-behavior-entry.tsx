import { useState } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@/components/ui/button";
import {
  IconButton,
  Price,
  QuantityStepper,
} from "@/components/ui/commerce-primitives";

function FoundationBehaviorFixture() {
  const [quantity, setQuantity] = useState(1);
  const [submits, setSubmits] = useState(0);

  return (
    <main data-testid="foundation-harness">
      <form
        data-testid="button-form"
        data-submits={submits}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((value) => value + 1);
        }}
      >
        <Button data-testid="button-default">Default button</Button>
        <Button data-testid="button-loading" loading loadingLabel="Loading acceptance">
          Save
        </Button>
        <IconButton data-testid="icon-button" label="Acceptance icon">
          <span aria-hidden="true">★</span>
        </IconButton>
      </form>

      <div data-testid="quantity-wrapper">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={2}
          label="Acceptance quantity"
        />
      </div>

      <Price data-testid="price" value={123456} />
    </main>
  );
}

const root = document.getElementById("app");
if (!root) throw new Error("Behavior fixture root not found");
createRoot(root).render(<FoundationBehaviorFixture />);
