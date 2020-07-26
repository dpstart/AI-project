package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.entities.Image;

import java.io.IOException;

public interface ImageService {

    Image getImage(String imageName);

    Image save(Image img) throws IOException;
}
