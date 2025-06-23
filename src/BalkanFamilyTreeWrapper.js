// src/BalkanFamilyTreeWrapper.js

import React, { useEffect, useRef } from 'react';

const BalkanFamilyTreeWrapper = ({ members }) => {
  const chartRef = useRef();
  // Use a useRef to hold the FamilyTree instance, as recommended by React for mutable objects
  const familyInstanceRef = useRef(null);

  useEffect(() => {
    // 1. Initial Checks
    if (typeof window.FamilyTree === 'undefined') {
      console.error("Balkan FamilyTree.js library not found globally. Make sure it's loaded before this component.");
      return;
    }
    if (!chartRef.current) {
      console.warn("Balkan FamilyTree Wrapper: chartRef.current is null on effect run.");
      return;
    }

    // 2. Cleanup (Always attempt to destroy previous instance first)
    if (familyInstanceRef.current && typeof familyInstanceRef.current.destroy === 'function') {
      try {
        console.log("BalkanFamilyTreeWrapper: Destroying existing instance for re-render.");
        familyInstanceRef.current.destroy();
      } catch (error) {
        console.error("Error destroying Balkan FamilyTree instance during re-render cleanup:", error);
      } finally {
        familyInstanceRef.current = null; // Always clear the ref after attempting to destroy
      }
    }

    // 3. Handle Empty Members Data
    if (!members || members.length === 0) {
      console.log("Balkan FamilyTree Wrapper: No members data to display, clearing chart area.");
      if (chartRef.current) {
        chartRef.current.innerHTML = ''; // Clear the div content if no members
      }
      return; // Exit if no members to render
    }

    // 4. Prepare Nodes for Balkan.js
    const nodes = members.map(member => {
        const node = {
            id: member.id,
            name: member.name,
            gender: member.gender || 'unknown',
            birthDate: member.birthDate || '',
            deathDate: member.deathDate || '',
            photo: member.photo || '', // Your photo URL is here, named 'photo'
        };

        // This logic determines primary parent (fid, mid) and other partners (pids)
        // Balkan.js handles partners through 'pids' on one of the partners, and the other partner
        // will automatically be linked. Children use 'fid' (father) and 'mid' (mother)
        // pointing to their biological parents.
        if (member.parents && member.parents.length > 0) {
            const parentsData = member.parents
                .map(parentId => members.find(m => m.id === parentId))
                .filter(Boolean); // Filter out any undefined parents if ID not found

            const father = parentsData.find(p => p.gender === 'male');
            const mother = parentsData.find(p => p.gender === 'female');

            if (father) node.fid = father.id; // Child's father
            if (mother) node.mid = mother.id; // Child's mother
        }

        if (member.spouse) {
            // 'pids' is for partners (spouses) in Balkan.js, not necessarily all parents
            node.pids = [member.spouse];
        }

        return node;
    });

    console.log("Balkan FamilyTree Wrapper: Nodes prepared for rendering:", nodes);

    // 5. Initialize the Balkan FamilyTree instance
    familyInstanceRef.current = new window.FamilyTree(chartRef.current, {
        scaleInitial: window.FamilyTree.match.boundary,
        toolbar: {
            zoom: true,
            fit: true,
            expandAll: true,
        },
        nodeBinding: {
            field_0: "name",
            field_1: "birthDate",
            field_2: "deathDate",
            img_0: "photo" // This binds your 'photo' field from your node data to Balkan's 'img_0' slot
        },
        nodes: nodes,
        // Define your templates here, including the actual <image> tag for img_0
        templates: {
            // The structure below defines the visual layout for each node type (male, female, unknown)
            // It includes an SVG <image> tag that uses '{img_0}' for its xlink:href,
            // which will be replaced by the actual photo URL from the 'photo' field in your node data.
            male: `<div class="balkan-node balkan-male-node">
                     <div class="balkan-node-content">
                       <div class="balkan-node-name">{field_0}</div>
                       <div class="balkan-node-details">{field_1}</div>
                       <div class="balkan-node-details">{field_2}</div>
                       <image preserveAspectRatio="xMidYMid slice" xlink:href="{img_0}" x="20" y="-15" width="80" height="80"></image>
                     </div>
                   </div>`,
            female: `<div class="balkan-node balkan-female-node">
                       <div class="balkan-node-content">
                         <div class="balkan-node-name">{field_0}</div>
                         <div class="balkan-node-details">{field_1}</div>
                         <div class="balkan-node-details">{field_2}</div>
                         <image preserveAspectRatio="xMidYMid slice" xlink:href="{img_0}" x="20" y="-15" width="80" height="80"></image>
                       </div>
                     </div>`,
            unknown: `<div class="balkan-node balkan-unknown-node">
                        <div class="balkan-node-content">
                          <div class="balkan-node-name">{field_0}</div>
                          <div class="balkan-node-details">{field_1}</div>
                          <div class="balkan-node-details">{field_2}</div>
                          <image preserveAspectRatio="xMidYMid slice" xlink:href="{img_0}" x="20" y="-15" width="80" height="80"></image>
                        </div>
                      </div>`
        },
    });

    // 6. Cleanup function: This will be called when the component unmounts or effect re-runs
    return () => {
      console.log("BalkanFamilyTreeWrapper cleanup: Attempting final destroy on unmount.");
      if (familyInstanceRef.current && typeof familyInstanceRef.current.destroy === 'function') {
        try {
          familyInstanceRef.current.destroy();
          console.log("Balkan FamilyTree instance destroyed successfully.");
        } catch (error) {
          console.error("Error destroying Balkan FamilyTree instance:", error);
        }
      }
      familyInstanceRef.current = null; // Always clear the reference
    };
  }, [members]); // Dependency array: re-run this effect if 'members' data changes

  // The actual div where Balkan.js will render the tree
  return <div id="tree" ref={chartRef} style={{ width: '100%', height: '700px' }}></div>;
};

export default BalkanFamilyTreeWrapper;