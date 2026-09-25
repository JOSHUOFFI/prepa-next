import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
const SUBJECT_ID="91f5f142-acbf-42bb-b85e-c58ef9d15d54";
const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function topicFor(text:string){const h=norm(text);
 if(/(simile|metaphor|personification|hyperbole|alliteration|onomatopoeia|oxymoron|euphemism|synecdoche)/.test(h))return"Figures of Speech";
 if(/(symbol|imagery|tone|mood|atmosphere)/.test(h))return"Imagery, Symbolism, Tone and Mood";
 if(/(point of view|narrator|diction|style|first person|third person)/.test(h))return"Point of View, Diction and Style";
 if(/(characteri|setting|plot structure)/.test(h))return"Characterisation, Setting and Plot Structure";
 if(/(character|conflict)/.test(h))return"Character, Setting and Conflict in Prose";
 if(/(plot|narrative perspective|denouement|climax|flashback)/.test(h))return"Plot, Theme and Narrative Perspective";
 if(/(novel|novella|short stor)/.test(h))return"Novel, Novella and Short Story";
 if(/(prose|realism|social context)/.test(h))return"Prose Analysis and Social Context";
 if(/(epic|ode|ballad|sonnet|lyric|elegy|poem type)/.test(h))return"Types and Forms of Poetry";
 if(/(rhyme|rhythm|alliteration|assonance|sound)/.test(h))return"Rhyme, Rhythm and Sound Devices";
 if(/(stanza|meter|metre|iambic|verse)/.test(h))return"Stanza, Meter and Poetic Structure";
 if(/(poetry|poem|poet)/.test(h))return"Poetic Imagery, Tone and Interpretation";
 if(/(soliloquy|aside|dialogue)/.test(h))return"Dialogue, Soliloquy and Aside";
 if(/(stage|audience|dramatic irony|props|scene)/.test(h))return"Stagecraft, Dramatic Irony and Audience";
 if(/(tragedy|comedy|drama|play)/.test(h))return"Tragedy, Comedy and Dramatic Forms";
 if(/(african|nigerian|soyi|achebe|adichie|rotimi|clark|amadi)/.test(h))return"Nigerian Writers, Works and Cultural Context";
 if(/(oral tradition|folklore|myth|legend|griot)/.test(h))return"African Oral and Written Literary Traditions";
 if(/(modernism|postmodern|existential|surreal|dada|magical realism)/.test(h))return"Literary Movements and Modern Literature";
 if(/(morrison|austen|eliot|camus|sartre|calvino|marquez|hurston|wiesel|mann|grass)/.test(h))return"World Authors, Works and Literary Periods";
 if(/(criticism|comparative)/.test(h))return"Literary Criticism and Comparative Appreciation";
 if(/(theme|context|interpret)/.test(h))return"Theme, Context and Literary Interpretation";
 if(/(genre|form|literature is|function of literature)/.test(h))return"Literary Genres and Forms";
 return "Meaning, Scope and Functions of Literature";
}
function difficulty(text:string):"easy"|"medium"|"hard"{const h=norm(text);if(/(analyse|infer|compare|best explains|interpret|significance|effect of)/.test(h))return"hard";if(/(theme|symbol|tone|mood|point of view|conflict|context|irony)/.test(h))return"medium";return"easy"}
async function main(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,key=process.env.SUPABASE_SERVICE_ROLE_KEY!;const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [{data:topics,error:te},{data:questions,error:qe}]=await Promise.all([db.from("topics").select("id,name").eq("subject_id",SUBJECT_ID).eq("is_active",true),db.from("questions").select("id,question_text,legacy_id,created_at").eq("subject_id",SUBJECT_ID).eq("is_active",true).order("created_at")]);if(te||qe)throw te||qe;const map=new Map((topics??[]).map(t=>[t.name,t.id]));const groups=new Map<string,typeof questions>();for(const q of questions??[]){const k=norm(q.question_text);groups.set(k,[...(groups.get(k)??[]),q]);}
 let archived=0,updated=0;for(const group of groups.values()){for(const duplicate of group.slice(1)){const {error}=await db.from("questions").update({is_active:false}).eq("id",duplicate.id);if(error)throw error;archived++;}}
 const retained=(questions??[]).filter(q=>(groups.get(norm(q.question_text))??[])[0]?.id===q.id);for(const q of retained){const id=map.get(topicFor(q.question_text));if(!id)throw new Error("Unmapped topic");const {error}=await db.from("questions").update({topic_id:id,difficulty:difficulty(q.question_text)}).eq("id",q.id);if(error)throw error;updated++;}
 const {data:final,error:fe}=await db.from("questions").select("id,question_text,topic_id,difficulty").eq("subject_id",SUBJECT_ID).eq("is_active",true);if(fe)throw fe;const ids=(final??[]).map(q=>q.id);const {data:opts,error:oe}=await db.from("question_options").select("question_id,option_label,option_text,is_correct").in("question_id",ids);if(oe)throw oe;const by=new Map<string,typeof opts>();for(const o of opts??[])by.set(o.question_id,[...(by.get(o.question_id)??[]),o]);const counts=new Map<string,number>();for(const q of final??[])counts.set(norm(q.question_text),(counts.get(norm(q.question_text))??0)+1);console.log(JSON.stringify({before:questions?.length,archived,retained:final?.length,updated,unassigned:final?.filter(q=>!q.topic_id).length,topics:Object.fromEntries((topics??[]).map(t=>[t.name,(final??[]).filter(q=>q.topic_id===t.id).length])),difficulty:Object.fromEntries(["easy","medium","hard"].map(d=>[d,(final??[]).filter(q=>q.difficulty===d).length])),exactDuplicates:[...counts.values()].filter(x=>x>1).reduce((a,x)=>a+x-1,0),invalidOptions:[...by.values()].filter(a=>a.length!==4||new Set(a.map(x=>x.option_label)).size!==4||a.some(x=>!x.option_text.trim())).length,invalidCorrect:[...by.values()].filter(a=>a.filter(x=>x.is_correct).length!==1).length},null,2));}
main().catch(e=>{console.error(e);process.exit(1)});
