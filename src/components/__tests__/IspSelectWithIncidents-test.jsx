import React from 'react';
import { shallow } from 'enzyme';
import chai, { expect } from 'chai';

import chaiEnzyme from 'chai-enzyme';
import { IspSelectWithIncidents } from 'components';

chai.use(chaiEnzyme());

describe('components', () => {
  describe('IspSelectWithIncidents', () => {
    it('selecting multiple ISPs', () => {
      // Sample data for this test, no incidents necessary we are just testing that 'selected' ASNs are checked.
      const isps = {
        AS10774x: { client_asn_name: 'AT&T', client_asn_number: 'AS10774x' },
        AS10796x: { client_asn_name: 'Time Warner Cable', client_asn_number: 'AS10796x' },
        AS11486x: { client_asn_name: 'Verizon', client_asn_number: 'AS11486x' },
        AS10507: { client_asn_name: 'Sprint Personal Communications Systems', client_asn_number: 'AS10507' },
      };
      const incidentData = {};
      const selected = [{ client_asn_name: 'AT&T', client_asn_number: 'AS10774x' }];

      const wrapper = shallow(
        <IspSelectWithIncidents
          incidentData={incidentData}
          isps={isps}
          selected={selected}
        />
      );

      // Select AT&T
      // TODO uncomment: expect(wrapper.find('#AS10774x').at(0).props.checked).to.equal(true);
      
      /* Where Roman left off:
          - Talk to Amy and ask what exactly to be testing here. You are currently testing that an ASN passed in as 'selected' will be checked (this is probably the wrong thing to test)
          - The reason that the test on the last line isnt finding anything is likely because the selected prop (line 21) that is being passed in isnt formatted properly.
      */
    });

    it('removing multiple ISPs', () => {
      expect(true).to.equal(true);
    });

    it('check if ISPs with incidents have an incident tooltip and an incident viewer button', () => {
      // Sample data for this test, should have two ISPs with incidents out of a total of four ISPs
      const isps = {
        AS10774x: { client_asn_name: 'AT&T', client_asn_number: 'AS10774x' },
        AS10796x: { client_asn_name: 'Time Warner Cable', client_asn_number: 'AS10796x' },
        AS11486x: { client_asn_name: 'Verizon', client_asn_number: 'AS11486x' },
        AS10507: { client_asn_name: 'Sprint Personal Communications Systems', client_asn_number: 'AS10507' },
      };
      const incidentData = {
        AS11486x: [{}, {}], // Verizon with 2 incidents
        AS10774x: [{}],  // AT&T with one incident
      };
      const selected = [];

      const wrapper = shallow(
        <IspSelectWithIncidents
          incidentData={incidentData}
          isps={isps}
          selected={selected}
        />
      );

      // There should be two incident tips because of the two different ISPs
      expect(wrapper.find('#incident-isp-tip')).to.have.lengthOf(2);

      // Both the row itself and the 'Show Incident' button have the same id,
      // so each ISP with an incident should have two instances of their id.
      expect(wrapper.find('#AS11486x')).to.have.lengthOf(2);
      expect(wrapper.find('#AS10774x')).to.have.lengthOf(2);
    });

    it('handling showing an incident for an ISP', () => {
      expect(true).to.equal(true);
    });

    it('handling showing multiple incidents for an ISP', () => {
      expect(true).to.equal(true);
    });
  });
});
