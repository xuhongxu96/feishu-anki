import { Block, BlockSnapshot, BlockType, BlockitClient, DocumentRef } from '@lark-opdev/block-docs-addon-api';

export interface AnkiCard {
    title: string,
    content: string,
}

const EmptyCard = () => {
    return {
        title: '',
        content: '',
    };
};

const DocMiniApp = new BlockitClient().initAPI();

const getHeadingLevel = (block: BlockSnapshot) => {
    const type = block.type.toString();
    if (type.startsWith("heading")) {
        return parseInt(type.substring("heading".length));
    } else if (type == BlockType.TEXT) {
        return 0;
    }

    return -1;
}

const isAllDigitPunct = (s: string) => {
    return /^[0-9./-\\]+$/.test(s);
}

export const extractAnki = async (docRef: DocumentRef) => {
    const blockSnapshot = await DocMiniApp.Document.getRootBlock(docRef);

    let cards: AnkiCard[] = [];
    let card = EmptyCard();
    for (let block of blockSnapshot.childSnapshots) {
        const headingLevel = getHeadingLevel(block);
        const content = block.data?.plain_text ?? "";

        if (isAllDigitPunct(content)) {
            continue;
        }

        if (headingLevel == -1) {
            continue;
        }

        if (headingLevel == 0) {
            card.content += content + "\n";
            continue;
        }

        if ((block.data?.order_text ?? "").length == 0) {
            card.content += content + "\n";
            continue;
        }

        if (card.content.trim().length > 0 && card.title.trim().length > 0) {
            cards.push(card);
            card = EmptyCard();
        }

        card.title = content;
    }

    if (card.content.trim().length > 0 && card.title.trim().length > 0) {
        cards.push(card);
    }

    return cards;
}