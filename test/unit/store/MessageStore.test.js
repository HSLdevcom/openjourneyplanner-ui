import { expect } from 'chai';
import fetchMock from 'fetch-mock';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import MessageStore, {
  processStaticMessages,
} from '../../../app/store/MessageStore';

describe('MessageStore', () => {
  describe('getMessages', () => {
    before(() => fetchMock.mockGlobal());

    afterEach(() => {
      fetchMock.removeRoutes();
      fetchMock.clearHistory();
    });

    after(() => fetchMock.unmockGlobal());

    it('should show higher priority first', async () => {
      const staticMessagesUrl = '/staticMessages';
      fetchMock.get(staticMessagesUrl, {
        staticMessages: [
          {
            id: '2',
            content: {
              en: [
                {
                  type: 'text',
                  content: 'foo',
                },
              ],
            },
          },
        ],
      });
      const store = new MessageStore();
      const config = {
        staticMessages: [
          {
            id: '1',
            content: {
              en: [
                {
                  type: 'text',
                  content: 'bar',
                },
              ],
            },
            priority: -1,
          },
        ],
        staticMessagesUrl,
      };

      await store.addConfigMessages(config);
      expect(fetchMock.callHistory.called(staticMessagesUrl)).to.equal(true);
      expect(store.getMessages()).to.deep.equal([
        {
          content: {
            en: [{ type: 'text', content: 'foo' }],
          },
          id: '2',
        },
        {
          content: {
            en: [{ type: 'text', content: 'bar' }],
          },
          id: '1',
          priority: -1,
        },
      ]);

      global.fetch = undefined;
    });
  });

  describe('processStaticMessages', () => {
    it('should process a message with content', () => {
      const staticMessages = [
        {
          id: '03022019_203257_08',
          content: {
            fi: [
              {
                type: 'text',
                content:
                  'Maanantaina 4.2. Leppävaaran A-junat ja Keravan K -junat liikennöivät 20 minuutin välein klo 14 saakka ',
              },
            ],
            en: [
              {
                type: 'text',
                content:
                  'On Monday 4 February, A and K trains run every 20 minutes until 2pm',
              },
            ],
            sv: [
              {
                type: 'text',
                content:
                  'A- och K-tågen går med 20 minuters mellanrum tills kl 14 ',
              },
            ],
          },
        },
      ];
      const callback = sinon.spy();
      processStaticMessages({ staticMessages }, callback);
      expect(callback.called).to.equal(true);
    });

    it('should ignore messages that have no content in any language', () => {
      const staticMessages = [
        {
          id: '03022019_203559_96',
          content: {
            fi: [],
            en: [],
            sv: [],
          },
        },
        {
          id: '03022019_203612_18',
          content: {
            fi: [],
            en: [],
            sv: [],
          },
        },
        {
          id: '03022019_203612_86',
          content: {
            fi: [],
            en: [],
            sv: [],
          },
        },
        {
          id: '04022019_060821_65',
          content: {
            fi: [],
            en: [],
            sv: [],
          },
        },
      ];
      const callback = sinon.spy();
      processStaticMessages({ staticMessages }, callback);
      expect(callback.called).to.equal(false);
    });

    it('should process messages that have content in some language', () => {
      const staticMessages = [
        {
          id: '03022019_203559_96',
          content: {
            fi: [],
            en: [
              {
                type: 'text',
                content: 'Foo',
              },
            ],
            sv: [],
          },
        },
      ];
      const callback = sinon.spy();
      processStaticMessages({ staticMessages }, callback);
      expect(callback.called).to.equal(true);
    });
  });

  describe('addMessage', () => {
    it('should add message', async () => {
      const store = new MessageStore();
      const message = {
        id: '1',
        content: {
          en: [
            {
              type: 'text',
              content: 'bar',
            },
          ],
        },
        priority: -1,
      };
      await store.addMessage(message);
      expect(store.getMessages().length).to.equal(1);
    });
  });
});
