import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { BlockitClient, BlockType, BlockSnapshot, DocumentRef } from '@lark-opdev/block-docs-addon-api';
import { AnkiCard, extractAnki } from './extractAnki';
import './index.css';

const DocMiniApp = new BlockitClient().initAPI();

interface MousePos {
  x: number, y: number,
}

export default () => {
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [gen, setGen] = useState<string>('待生成');
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });

  const interval = useRef<number>(new Date().getTime());
  const docRef = useRef<DocumentRef>(null);

  const updateDoc = useCallback(async (docRef: DocumentRef) => {
    let cards = await extractAnki(docRef);
    await DocMiniApp.Bridge.updateHeight(Math.max(300, cards.length * 30) + 20 * 2 + 64);
    setCards(cards);
  }, []);

  const genAnki = useCallback(() => {
    const norm = (s: string) => {
      return s.replaceAll("\t", " ").trim().replaceAll('\n', '<br>');
    };

    let res = '';
    for (let card of cards) {
      res += norm(card.title) + "\t" + norm(card.content) + "\n";
    }

    setGen(res);
  }, [cards]);

  const INTERVAL = 3000;

  useEffect(() => {
    (async () => {
      //获取文档引用
      docRef.current = await DocMiniApp.getActiveDocumentRef();
      //监听文档变化
      DocMiniApp.Selection.onSelectionChange(docRef.current, () => {
        let now = new Date().getTime();
        if (now - interval.current > INTERVAL) {
          updateDoc(docRef.current);
          interval.current = now;
        }
      });
      //初始化
      updateDoc(docRef.current);
    })();
    return () => {
      (async () => {
        DocMiniApp.Selection.offSelectionChange(docRef.current, () => { });
      })();
    };
  }, []);

  const onMouseMove = useCallback((e) => {
    setMousePos({
      x: e.clientX + 5,
      y: e.clientY + 5,
    });
  }, []);

  return (
    <div className="anki" onMouseMove={onMouseMove}>

      {useMemo(() => (<ul>
        {
          cards.map((o: AnkiCard, i) => {
            return <li key={i} onMouseEnter={(e) => {
              setSelectedCardIndex(i);
            }}>{o.title}</li>
          })
        }
      </ul>), [cards])}

      <div className="content" style={
        {
          left: mousePos.x,
          top: mousePos.y,
        }
      }><pre>{selectedCardIndex >= cards.length ? "" : cards[selectedCardIndex].content}</pre></div>

      <button className="btn" onClick={genAnki}>生成Anki</button>

      <textarea rows={20} value={gen} />

    </div>
  );
};
