"use strict";

let blindSignatures = require('blind-signatures');
let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
}

let agency = new SpyAgency();

// Prepare 10 documents with different cover identities
let coverNames = ["Agent X", "Shadow", "Nightfall", "Ghost", "Eagle", "Raven", "Phantom", "Viper", "Falcon", "Storm"];
let documents = coverNames.map(makeDocument);

// Blind the documents and store the blinding factors
let blindedDocs = [];
let blindingFactors = [];

documents.forEach(doc => {
  let { blinded, r } = blind(doc, agency.n, agency.e);
  blindedDocs.push(blinded);
  blindingFactors.push(r);
});

agency.signDocument(blindedDocs, (selected, verifyAndSign) => {
  // Prepare the data required for signing all documents except the selected one
  let verifiedFactors = blindingFactors.map((r, index) => (index === selected ? undefined : r));
  let originalDocs = documents.map((doc, index) => (index === selected ? undefined : doc));
  
  let signedBlind = verifyAndSign(verifiedFactors, originalDocs);
  let unblindedSig = unblind(blindingFactors[selected], signedBlind, agency.n);
  
  console.log("Signed Document:", documents[selected]);
  console.log("Signature:", unblindedSig);
});
