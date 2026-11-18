"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type BrandKey = "stariuxe" | "propertyos";
type Fields = { fullName: string; role: string; company: string; email: string; phone: string; website: string; address: string; logoUrl: string; photoUrl: string; linkedin: string; instagram: string; x: string; accent: string; };
const presets: Record<BrandKey, Partial<Fields>> = {
  stariuxe: { company: "Stariuxe Enterprises", website: "", accent: "#12b8bd" },
  propertyos: { company: "PropertyOS AI", website: "https://propertyosai.cc.cd", accent: "#5e9d87" },
};
const initial: Fields = { fullName: "", role: "", company: presets.propertyos.company!, email: "", phone: "", website: presets.propertyos.website!, address: "Nairobi, Kenya", logoUrl: "", photoUrl: "", linkedin: "", instagram: "", x: "", accent: presets.propertyos.accent! };
const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const safeUrl = (value: string) => /^https:\/\//i.test(value.trim()) ? value.trim() : "";

export default function EmailSignatureStudio() {
  const [brand, setBrand] = useState<BrandKey>("propertyos");
  const [fields, setFields] = useState<Fields>(initial);
  const [layout, setLayout] = useState<"classic" | "compact">("classic");
  const [notice, setNotice] = useState("");
  const update = (key: keyof Fields, value: string) => setFields((old) => ({ ...old, [key]: value }));
  const changeBrand = (value: BrandKey) => { setBrand(value); setFields((old) => ({ ...old, ...presets[value], company: presets[value].company! })); };
  const html = useMemo(() => {
    const name = esc(fields.fullName || "Your Name");
    const role = esc(fields.role || "Your Position");
    const company = esc(fields.company || (brand === "propertyos" ? "PropertyOS AI" : "Stariuxe Enterprises"));
    const accent = /^#[0-9a-f]{6}$/i.test(fields.accent) ? fields.accent : "#5e9d87";
    const logo = safeUrl(fields.logoUrl);
    const photo = safeUrl(fields.photoUrl);
    const details = [
      fields.email && '<a href="mailto:' + esc(fields.email) + '" style="color:#52615c;text-decoration:none">' + esc(fields.email) + '</a>',
      fields.phone && '<a href="tel:' + esc(fields.phone) + '" style="color:#52615c;text-decoration:none">' + esc(fields.phone) + '</a>',
      safeUrl(fields.website) && '<a href="' + esc(safeUrl(fields.website)) + '" style="color:' + accent + ';text-decoration:none">' + esc(fields.website.replace(/^https?:\/\//, "")) + '</a>',
      fields.address && '<span style="color:#74817b">' + esc(fields.address) + '</span>',
    ].filter(Boolean).join('<span style="color:#c2cbc5;padding:0 7px">|</span>');
    const socials = [
      safeUrl(fields.linkedin) && '<a href="' + esc(safeUrl(fields.linkedin)) + '" style="color:' + accent + ';text-decoration:none">LinkedIn</a>',
      safeUrl(fields.instagram) && '<a href="' + esc(safeUrl(fields.instagram)) + '" style="color:' + accent + ';text-decoration:none">Instagram</a>',
      safeUrl(fields.x) && '<a href="' + esc(safeUrl(fields.x)) + '" style="color:' + accent + ';text-decoration:none">X</a>',
    ].filter(Boolean).join('<span style="color:#c2cbc5;padding:0 7px">|</span>');
    const image = photo ? '<img src="' + esc(photo) + '" width="68" height="68" alt="' + name + '" style="display:block;width:68px;height:68px;object-fit:cover;border-radius:50%;border:2px solid ' + accent + '"/>' : "";
    const brandMark = logo ? '<img src="' + esc(logo) + '" width="116" alt="' + company + '" style="display:block;max-width:116px;height:auto;margin-bottom:8px"/>' : '<div style="font:700 12px Arial,sans-serif;letter-spacing:2px;color:' + accent + ';margin-bottom:8px">' + company.toUpperCase() + '</div>';
    if (layout === "compact") return '<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;color:#23342e;max-width:560px"><tr><td style="border-left:3px solid ' + accent + ';padding:4px 0 4px 13px">' + brandMark + '<div style="font-size:15px;font-weight:700">' + name + '</div><div style="font-size:12px;color:#68766f;margin:3px 0 8px">' + role + ' · ' + company + '</div><div style="font-size:11px;line-height:1.8">' + details + '</div><div style="font-size:11px;margin-top:5px">' + socials + '</div></td></tr></table>';
    return '<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;color:#23342e;max-width:600px"><tr><td style="vertical-align:top;padding:4px 14px 4px 0">' + image + '</td><td style="vertical-align:top;border-left:2px solid ' + accent + ';padding:2px 0 2px 14px">' + brandMark + '<div style="font-size:16px;font-weight:700;line-height:1.3">' + name + '</div><div style="font-size:12px;color:#68766f;margin:3px 0 8px">' + role + '</div><div style="font-size:12px;font-weight:700;margin-bottom:7px">' + company + '</div><div style="font-size:11px;line-height:1.9">' + details + '</div><div style="font-size:11px;margin-top:5px">' + socials + '</div></td></tr></table>';
  }, [fields, brand, layout]);
  const plain = [fields.fullName, fields.role, fields.company, fields.email, fields.phone, fields.website, fields.address, [fields.linkedin, fields.instagram, fields.x].filter(Boolean).join(" · ")].filter(Boolean).join("\n");
  async function copy(value: string, label: string) { try { await navigator.clipboard.writeText(value); setNotice(label + " copied."); } catch { setNotice("Clipboard access was blocked. Select and copy the generated content manually."); } }
  function download() { const blob = new Blob(["<!doctype html><meta charset=\"utf-8\"><title>Email signature</title>" + html], { type: "text/html;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "email-signature.html"; a.click(); URL.revokeObjectURL(url); setNotice("HTML signature file downloaded."); }
  const field = (label: string, key: keyof Fields, placeholder = "") => <label className={styles.field}>{label}<input value={fields[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} /></label>;
  return <main className={styles.page}>
    <header className={styles.header}><a href="/" className={styles.brand}><span className={styles.mark}>S</span><span>STARIUXE <small>BUSINESS TOOLS</small></span></a><a className={styles.back} href="/dashboard">← Back to workspace</a></header>
    <section className={styles.hero}><p className={styles.eyebrow}>STARIUXE ENTERPRISES / COMMUNICATION TOOLS</p><h1>Email Signature <em>Studio.</em></h1><p>Create consistent, professional email signatures for your business in minutes. Preview, copy or download your signature without sending your details to a third party.</p><div className={styles.pills}><span>HTML export</span><span>Gmail & Outlook friendly</span><span>Local-only editor</span></div></section>
    <section className={styles.workspace}>
      <div className={styles.editor}>
        <div className={styles.sectionHead}><div><span>01 / YOUR DETAILS</span><h2>Build your signature</h2></div><label className={styles.selectWrap}>BRAND<select value={brand} onChange={(e) => changeBrand(e.target.value as BrandKey)}><option value="propertyos">PropertyOS AI</option><option value="stariuxe">Stariuxe Enterprises</option></select></label></div>
        <div className={styles.fields}>
          {field("Full name", "fullName", "e.g. Claire Dawson")}
          {field("Job title", "role", "e.g. Founder & CEO")}
          {field("Company name", "company", "Your company")}
          {field("Work email", "email", "you@company.com")}
          {field("Phone", "phone", "+254 7xx xxx xxx")}
          {field("Website (https://)", "website", "https://example.com")}
          {field("Location", "address", "Nairobi, Kenya")}
          {field("Logo image URL (https://)", "logoUrl", "Publicly hosted logo image URL")}
          {field("Profile photo URL (https://)", "photoUrl", "Publicly hosted photo URL")}
          {field("LinkedIn URL", "linkedin", "https://linkedin.com/in/...")}
          {field("Instagram URL", "instagram", "https://instagram.com/...")}
          {field("X / Twitter URL", "x", "https://x.com/...")}
        </div>
        <div className={styles.designRow}><label>Accent colour <input type="color" value={fields.accent} onChange={(e) => update("accent", e.target.value)} /></label><div className={styles.layoutToggle}><button className={layout === "classic" ? styles.active : ""} onClick={() => setLayout("classic")}>Classic</button><button className={layout === "compact" ? styles.active : ""} onClick={() => setLayout("compact")}>Compact</button></div></div>
        <div className={styles.actions}><button className={styles.primary} onClick={() => copy(html, "HTML signature")}>Copy HTML signature</button><button className={styles.secondary} onClick={() => copy(plain, "Plain-text signature")}>Copy plain text</button><button className={styles.secondary} onClick={download}>Download .html</button></div>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        <p className={styles.privacy}>Your entries stay in this browser page and are not saved to a database. Use publicly accessible HTTPS image URLs; images selected from your phone are not embedded in outgoing email signatures.</p>
      </div>
      <aside className={styles.preview}>
        <div className={styles.previewTop}><span>02 / LIVE PREVIEW</span><span className={styles.previewDot}>● LIVE</span></div>
        <div className={styles.emailMock}><div className={styles.mailBar}><span>✉</span> New message <i>•••</i></div><div className={styles.mailLine}>To</div><div className={styles.mailLine}>Subject</div><div className={styles.mailBody}>Hi there,<br/><br/>Looking forward to connecting with you.<br/><br/>Best regards,</div><div className={styles.signature} dangerouslySetInnerHTML={{ __html: html }} /></div>
        <div className={styles.previewFoot}><b>READY FOR YOUR INBOX</b><p>Copy the HTML signature, then paste it into your email client's signature settings. Some clients may require images to be hosted publicly.</p></div>
        <div className={styles.tip}><b>Gmail</b><p>Settings → See all settings → General → Signature. Paste the copied signature into the editor.</p><b>Outlook</b><p>Settings → Accounts → Signatures, or open the signature editor in classic Outlook and paste.</p></div>
      </aside>
    </section>
    <footer className={styles.footer}>STARIUXE ENTERPRISES · INTERNAL BUSINESS TOOL <span>PropertyOS AI ecosystem</span></footer>
  </main>;
}
