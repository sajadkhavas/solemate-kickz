import { useState } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@/components/ui/button";
import {
  IconButton,
  Price,
  QuantityStepper,
  SearchInput,
} from "@/components/ui/commerce-primitives";

function FoundationBehaviorFixture() {
  const [quantity, setQuantity] = useState(1);
  const [submits, setSubmits] = useState(0);
  const [asChildActivations, setAsChildActivations] = useState(0);
  const [searchValue, setSearchValue] = useState("shoe");

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
        <Button data-testid="button-small" size="sm">
          Small button
        </Button>
        <Button data-testid="button-loading" loading loadingLabel="Loading acceptance">
          Save
        </Button>
        <Button
          asChild
          loading
          loadingLabel="Loading link acceptance"
          data-testid="button-as-child-loading"
          onClick={() => setAsChildActivations((value) => value + 1)}
        >
          <a href="#blocked-activation" data-activations={asChildActivations}>
            Blocked link
          </a>
        </Button>
        <IconButton data-testid="icon-button" label="Acceptance icon">
          <span aria-hidden="true">★</span>
        </IconButton>
        <IconButton data-testid="icon-button-small" label="Acceptance compact icon" size="sm">
          <span aria-hidden="true">☆</span>
        </IconButton>
      </form>

      <SearchInput
        data-testid="search-input"
        value={searchValue}
        onChange={(event) => setSearchValue(event.currentTarget.value)}
        onClear={() => setSearchValue("")}
        clearLabel="Clear acceptance search"
      />

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
