import assert from "node:assert/strict";
import test from "node:test";
import { calculatePublicationConfidence,completenessScore,type PublicationQuality } from "./confidence";
const complete:PublicationQuality={hasTitle:true,hasDescription:true,hasImage:true,hasLocation:true,hasDateTime:true,hasPrice:true,hasAge:true,hasTicket:true,hasOrganizer:true,hasEnd:true};
test("completeness weights sum to one",()=>assert.equal(completenessScore(complete),1));
test("auto-publishes high confidence official data",()=>assert.equal(calculatePublicationConfidence({aiConfidence:.96,sourceTrustScores:[.95],quality:complete}).decision,"AUTO_PUBLISH"));
test("sends an uncertain source to moderation",()=>assert.equal(calculatePublicationConfidence({aiConfidence:.9,sourceTrustScores:[.4],quality:{...complete,hasImage:false,hasTicket:false}}).decision,"MODERATION"));
test("holds incomplete low-confidence data",()=>assert.equal(calculatePublicationConfidence({aiConfidence:.55,sourceTrustScores:[.3],quality:{...complete,hasDescription:false,hasImage:false,hasLocation:false,hasPrice:false,hasAge:false,hasTicket:false,hasOrganizer:false,hasEnd:false}}).decision,"HOLD"));
test("adds bounded corroboration bonus",()=>{const one=calculatePublicationConfidence({aiConfidence:.7,sourceTrustScores:[.7],quality:complete});const many=calculatePublicationConfidence({aiConfidence:.7,sourceTrustScores:[.7,.6,.5,.4],quality:complete});assert.equal(many.corroborationBonus,.08);assert.ok(many.total>one.total)});
