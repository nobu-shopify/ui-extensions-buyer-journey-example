//import React from 'react';
import {
  useExtensionApi,
  render,
  Banner,
  BlockStack,
  Heading,
  useAttributes,
  useShippingAddress,
  useExtensionCapability,
  useBuyerJourneyIntercept,
  useTranslate,
} from '@shopify/checkout-ui-extensions-react';
import React, { useState, useEffect } from "react";

render('Checkout::Dynamic::Render', () => <App />);

function App() {
  const {extensionPoint} = useExtensionApi();
  const translate = useTranslate();
  const attributes = useAttributes();
  const attribute_zip = attributes.filter(attribute => { return attribute.key == "zip"; });
  const address = useShippingAddress();

  console.log("attribute_zip, ", attribute_zip);
  console.log("zip, ", address.zip);

  const [validationError, setValidationError] = useState("");
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  const canBlockProgress = useExtensionCapability("block_progress");
  const label = canBlockProgress ? "郵便番号一致チェック" : "郵便番号一致チェック (optional)";

  useEffect(() => {
    if (canBlockProgress && isZipSet() && !isZipValid()) {
      showValidationErrors();
      return;
    }
    clearValidationErrors();
  }, [address.zip]);

  useBuyerJourneyIntercept(() => {
    // Validate that the age of the buyer is known, and that they're old enough to complete the purchase
    if (!isZipSet()) {
      return {
        behavior: "block",
        reason: "郵便番号が入力されていません",
        perform: (result) => {
          // If we were able to block progress, set a validation error
          if (result.behavior === "block") {
            setValidationError("郵便番号を入力してください");
          }
        },
      };
    }

    if (!isZipValid()) {
      return {
        behavior: "block",
        reason: `郵便番号がマッチしません ${attribute_zip[0].value}.`,
        perform: (result) => {
          // If progress can be blocked, then set a validation error, and show the banner
          if (result.behavior === "block") {
            showValidationErrors();
          }
        },
      };
    }

    return {
      behavior: "allow",
      perform: () => {
        // Ensure any errors are hidden
        clearValidationErrors();
      },
    };
  });

  function isZipSet() {
    return address.zip !== undefined;
  }

  function isZipValid() {
    return address.zip == attribute_zip[0].value;
  }

  function showValidationErrors() {
    setShowErrorBanner(true);
  }

  function clearValidationErrors() {
    setValidationError("");
    setShowErrorBanner(false);
  }

  console.log("ZIP? ", isZipSet(), isZipValid());

  return (
    <BlockStack>
      <Heading level={3}>ZIPCODE VALIDATION</Heading>
      {showErrorBanner && (
        <Banner status="critical">
          カート入力郵便番号({attribute_zip[0].value})と一致しません 
        </Banner>
      )}

    </BlockStack>
  );
}